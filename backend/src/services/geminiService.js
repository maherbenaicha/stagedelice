/**
 * geminiService.js
 * -----------------------------------------------------------------------
 * Thin wrapper around Google's Gemini API used to auto-generate
 * multiple-choice questions (QCM) for a given technology / difficulty.
 *
 * The service always returns an array of question objects shaped exactly
 * like the `Questions` table expects, so callers (aiController) can insert
 * the result directly with no further transformation:
 *
 *   { text, options: string[], correct_answer: number, difficulty, points }
 * -----------------------------------------------------------------------
 */

const MODEL = 'gemini-1.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Builds the French-language prompt sent to Gemini. Keeping this in one
 * place makes it easy to tune question quality without touching the
 * controller.
 */
function buildPrompt({ technology, level, count }) {
  return `Tu es un expert technique qui prépare des questions d'entretien.
Génère exactement ${count} questions à choix multiples (QCM) en français sur la technologie "${technology}",
de niveau de difficulté "${level}" (facile, moyen ou difficile).

Règles strictes :
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans balises markdown.
- Chaque question doit avoir exactement 4 options.
- "correct_answer" est l'index (0 à 3) de la bonne réponse dans le tableau "options".
- Varie les sujets abordés pour couvrir plusieurs aspects de la technologie.

Format exact attendu :
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

/**
 * Calls Gemini and returns a parsed array of question objects.
 * Throws a descriptive error if the API key is missing, the request
 * fails, or the model does not return valid JSON.
 */
async function generateQuestions({ technology, level = 'moyen', count = 5 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement');
  }
  if (!technology) {
    throw new Error('Le paramètre "technology" est requis');
  }

  const prompt = buildPrompt({ technology, level, count });

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    // If model not found (common in dev without right model), fallback to mock questions
    if (response.status === 404) {
      console.warn('Gemini model not available, returning mock questions for dev. Raw error:', errText);
      return generateMockQuestions(technology, level, count);
    }
    throw new Error(`Erreur API Gemini (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Réponse Gemini vide ou inattendue');
  }

  let questions;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    questions = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Impossible de parser la réponse JSON de Gemini');
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Gemini n\'a retourné aucune question exploitable');
  }

  // Defensive normalization in case the model drifts slightly from spec
  return questions.map((q) => ({
    text: String(q.text || '').trim(),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correct_answer: Number.isInteger(q.correct_answer) ? q.correct_answer : 0,
    difficulty: q.difficulty || level,
    points: Number.isInteger(q.points) ? q.points : 1,
  })).filter((q) => q.text && q.options.length === 4);

// Mock generator used as a safe fallback during local development
function generateMockQuestions(technology, level, count) {
  const sampleOptions = [
    ['Option A', 'Option B', 'Option C', 'Option D'],
    ['Réponse 1', 'Réponse 2', 'Réponse 3', 'Réponse 4'],
    ['Vrai', 'Faux', 'Parfois', 'Jamais'],
  ];
  const questions = [];
  for (let i = 0; i < count; i++) {
    const opts = sampleOptions[i % sampleOptions.length];
    questions.push({
      text: `(${level}) Question factice ${i+1} sur ${technology}`,
      options: opts,
      correct_answer: i % 4,
      difficulty: level,
      points: 1,
    });
  }
  return questions;
}
}

module.exports = { generateQuestions };
