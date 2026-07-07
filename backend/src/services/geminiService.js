/**
 * geminiService.js (utilise Groq)
 * Génère des QCM techniques via l'API Groq (100% gratuit).
 * Modèle : llama-3.3-70b-versatile
 *
 * Variable d'environnement requise :
 *   GROQ_API_KEY  — votre clé Groq dans le fichier .env
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt({ technology, level, count }) {
  return `Tu es un expert technique qui prépare des questions d'entretien.
Génère exactement ${count} questions à choix multiples (QCM) en français sur la technologie "${technology}",
de niveau de difficulté "${level}" (facile, moyen ou difficile).

Règles STRICTES :
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans balises markdown.
- Chaque question doit avoir exactement 4 options réalistes et distinctes.
- "correct_answer" est l'index (0 à 3) de la bonne réponse dans le tableau "options".
- Les questions doivent être précises, techniques et liées à la vraie pratique de ${technology}.
- Varie les sujets abordés pour couvrir plusieurs aspects de la technologie.

Format exact attendu (JSON pur, rien d'autre) :
[
  {
    "text": "Enoncé de la question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "difficulty": "${level}",
    "points": 1
  }
]`;
}

async function generateQuestions({ technology, level = 'moyen', count = 5 }) {
  if (!technology) {
    throw new Error('Le paramètre "technology" est requis');
  }

  // La clé Groq est stockée sous GROQ_API_KEY dans le .env
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY manquante. Ajoutez votre clé Groq dans le fichier .env sous GROQ_API_KEY'
    );
  }

  const prompt = buildPrompt({ technology, level, count });

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
  } catch (networkErr) {
    throw new Error(`Impossible de joindre l'API Groq : ${networkErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur API Groq (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error('Réponse Groq vide ou inattendue : ' + JSON.stringify(data));
  }

  let questions;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    questions = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `Impossible de parser la réponse JSON de Groq : ${e.message}\n\nRéponse brute : ${rawText.slice(0, 300)}`
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Groq n'a retourné aucune question exploitable");
  }

  const normalized = questions
    .map((q) => ({
      text: String(q.text || '').trim(),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correct_answer: Number.isInteger(q.correct_answer) ? q.correct_answer : 0,
      difficulty: q.difficulty || level,
      points: Number.isInteger(q.points) ? q.points : 1,
    }))
    .filter((q) => q.text && q.options.length === 4);

  if (normalized.length === 0) {
    throw new Error('Aucune question valide après normalisation');
  }

  return normalized;
}

module.exports = { generateQuestions };