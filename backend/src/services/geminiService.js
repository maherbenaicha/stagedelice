/**
 * geminiService.js (utilise Groq)
 * Module IA : QCM, analyse CV, scoring, offres, pipeline, emails, insights.
 * Modèle : llama-3.3-70b-versatile
 *
 * Variable d'environnement requise : GROQ_API_KEY
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(prompt, { temperature = 0.4, max_tokens = 4096 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY manquante. Ajoutez votre clé Groq dans le fichier .env');
  }

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens,
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
  return rawText;
}

function parseJsonResponse(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `Impossible de parser la réponse JSON de Groq : ${e.message}\n\nRéponse brute : ${rawText.slice(0, 400)}`
    );
  }
}

async function callGroqJSON(prompt, options) {
  const raw = await callGroq(prompt, options);
  return parseJsonResponse(raw);
}

function buildQuestionsPrompt({ technology, level, count }) {
  return `Tu es un expert technique qui prépare des questions d'entretien.
Génère exactement ${count} questions à choix multiples (QCM) en français sur la technologie "${technology}",
de niveau de difficulté "${level}" (facile, moyen ou difficile).

Règles STRICTES :
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans balises markdown.
- Chaque question doit avoir exactement 4 options réalistes et distinctes.
- "correct_answer" est l'index (0 à 3) de la bonne réponse dans le tableau "options".

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

async function generateQuestions({ technology, level = 'moyen', count = 5 }) {
  if (!technology) throw new Error('Le paramètre "technology" est requis');

  const questions = await callGroqJSON(buildQuestionsPrompt({ technology, level, count }), { temperature: 0.7 });

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

  if (normalized.length === 0) throw new Error('Aucune question valide après normalisation');
  return normalized;
}

async function extractCVData(cvText) {
  const prompt = `Tu es un expert RH spécialisé dans l'analyse de CV.
Analyse le texte du CV ci-dessous et extrais les informations structurées.

Règles STRICTES :
- Réponds UNIQUEMENT avec un objet JSON valide, sans markdown.
- Si une information est absente, utilise null ou un tableau vide.
- years_of_experience doit être un nombre entier estimé.

Format JSON attendu :
{
  "full_name": "Nom complet",
  "email": "email@example.com",
  "phone": "+33...",
  "education": [{"degree": "...", "school": "...", "year": "..."}],
  "diplomas": ["..."],
  "experiences": [{"title": "...", "company": "...", "duration": "...", "description": "..."}],
  "years_of_experience": 3,
  "technical_skills": ["React", "Node.js"],
  "languages": [{"language": "Français", "level": "Natif"}],
  "certifications": ["..."],
  "technologies": ["React", "Docker"]
}

Texte du CV :
${cvText.slice(0, 12000)}`;

  return callGroqJSON(prompt, { temperature: 0.2, max_tokens: 4096 });
}

async function scoreCandidate(jobOffer, extractedData) {
  const prompt = `Tu es un expert RH. Évalue la compatibilité entre ce candidat et cette offre d'emploi.

OFFRE :
Titre: ${jobOffer.title}
Poste: ${jobOffer.position}
Niveau: ${jobOffer.level || 'Non précisé'}
Technologies: ${jobOffer.technologies || ''}
Compétences requises: ${jobOffer.required_skills_json || '[]'}
Profil recherché: ${jobOffer.desired_profile || ''}

CANDIDAT (données extraites) :
${JSON.stringify(extractedData, null, 2)}

Règles STRICTES :
- Réponds UNIQUEMENT avec un objet JSON valide.
- Tous les scores sont des entiers entre 0 et 100.
- strengths et missing_skills sont des tableaux de strings (compétences/technologies).
- explanation doit expliquer clairement le score global en 2-4 phrases.

Format JSON :
{
  "score_global": 87,
  "score_technical": 92,
  "score_experience": 85,
  "score_education": 90,
  "score_certifications": 80,
  "score_languages": 75,
  "strengths": ["React", "Node.js", "SQL"],
  "missing_skills": ["AWS", "Kubernetes"],
  "explanation": "Le candidat possède une solide expérience..."
}`;

  return callGroqJSON(prompt, { temperature: 0.3 });
}

async function generateCandidateSummary(jobOffer, extractedData, scoreData) {
  const prompt = `Tu es un expert RH. Génère une fiche candidat synthétique pour le recruteur.

OFFRE : ${jobOffer.title} (${jobOffer.level || ''})
CANDIDAT : ${JSON.stringify(extractedData, null, 2)}
SCORE : ${JSON.stringify(scoreData, null, 2)}

Règles STRICTES : réponds UNIQUEMENT en JSON valide.

Format :
{
  "profile_summary": "Développeur Full Stack avec 3 ans d'expérience...",
  "main_skills": ["React", "JavaScript", "Node.js"],
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendation": "Profil adapté pour un poste Full Stack Junior."
}`;

  return callGroqJSON(prompt, { temperature: 0.4 });
}

async function generateJobOffer({ position, level, technologies }) {
  const prompt = `Tu es un expert RH. Génère une offre d'emploi complète en français.

Entrées :
- Poste : ${position}
- Niveau : ${level}
- Technologies : ${technologies}

Règles STRICTES : réponds UNIQUEMENT en JSON valide.

Format :
{
  "title": "Titre professionnel du poste",
  "description": "Description générale du poste...",
  "missions": "Liste des missions principales...",
  "responsibilities": "Responsabilités détaillées...",
  "required_skills": ["Spring Boot", "SQL", "..."],
  "desired_profile": "Profil idéal recherché...",
  "recommended_questions": ["Question technique 1?", "Question technique 2?"]
}`;

  return callGroqJSON(prompt, { temperature: 0.6 });
}

async function generateRecruitmentPipeline(jobOffer) {
  const prompt = `Tu es un expert RH. Propose un parcours de recrutement adapté à cette offre.

Offre : ${jobOffer.title}
Poste : ${jobOffer.position}
Niveau : ${jobOffer.level || 'Non précisé'}
Technologies : ${jobOffer.technologies || ''}

Règles STRICTES : réponds UNIQUEMENT en JSON valide.

Format :
{
  "steps": [
    {"order": 1, "title": "Analyse CV IA", "description": "Analyse automatique des candidatures"},
    {"order": 2, "title": "Test technique", "description": "..."},
    {"order": 3, "title": "Entretien technique", "description": "..."},
    {"order": 4, "title": "Entretien RH", "description": "..."},
    {"order": 5, "title": "Décision finale", "description": "..."}
  ]
}`;

  return callGroqJSON(prompt, { temperature: 0.5 });
}

async function generatePersonalizedEmail({ templateType, candidate, jobOffer, extraContext = '' }) {
  const types = {
    invitation_test: 'Invitation à passer un test technique',
    acceptation: 'Acceptation de candidature',
    refus: 'Refus de candidature (poli et professionnel)',
    invitation_entretien: 'Invitation à un entretien',
    relance: 'Relance candidat sans réponse',
  };

  const prompt = `Tu es un expert RH. Rédige un email professionnel en français.

Type : ${types[templateType] || templateType}
Candidat : ${candidate.full_name || 'Candidat'} (${candidate.email || ''})
Offre : ${jobOffer.title}
Contexte : ${extraContext}

Règles STRICTES : réponds UNIQUEMENT en JSON valide.

Format :
{
  "subject": "Objet de l'email",
  "body": "Corps complet de l'email avec formule de politesse"
}`;

  return callGroqJSON(prompt, { temperature: 0.6 });
}

async function generateDashboardInsights(statsContext) {
  const prompt = `Tu es un analyste RH. Génère 3 à 5 insights actionnables basés sur ces statistiques de recrutement.

Données :
${JSON.stringify(statsContext, null, 2)}

Règles STRICTES : réponds UNIQUEMENT en JSON valide.

Format :
{
  "insights": [
    "Les candidats React sont plus nombreux cette semaine.",
    "La compétence Docker manque chez 70% des candidats."
  ]
}`;

  return callGroqJSON(prompt, { temperature: 0.5 });
}

/**
 * Assistant conversationnel contextuel pour la RH.
 * `context` est un instantané des données actuelles de la plateforme
 * (tests, sessions, candidats, offres, candidatures) construit par
 * aiController.chat — le modèle ne doit répondre qu'à partir de ces
 * données, jamais en inventer.
 */
async function chatWithAssistant({ message, history = [], context }) {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'RH' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const prompt = `Tu es l'assistant IA intégré à StageDélice, une plateforme de recrutement technique (tests QCM + module Talent/CV). Tu aides un(e) membre des Ressources Humaines à interpréter les données de la plateforme.

Instantané des données actuelles de la plateforme (JSON) :
${JSON.stringify(context, null, 2)}

Règles STRICTES :
- Réponds en français, de façon concise et actionnable (quelques phrases ou une courte liste à puces).
- Base-toi UNIQUEMENT sur les données fournies ci-dessus. Si l'information demandée n'y figure pas, dis-le clairement et indique dans quelle page de la plateforme la RH peut la trouver (Tests, Candidats, Talent, Offres, Rapports...), sans jamais inventer de chiffre.
- Ne donne aucun conseil ou commentaire pouvant être discriminatoire (âge, genre, origine, religion, situation familiale, etc.) : reste centré sur les compétences et l'adéquation au poste.
- Pas de préambule du type "Voici ma réponse" : réponds directement à la question.
${historyText ? `\nHistorique récent de la conversation :\n${historyText}\n` : ''}
Question de la RH : ${message}`;

  return callGroq(prompt, { temperature: 0.3, max_tokens: 700 });
}

module.exports = {
  generateQuestions,
  extractCVData,
  scoreCandidate,
  generateCandidateSummary,
  generateJobOffer,
  generateRecruitmentPipeline,
  generatePersonalizedEmail,
  generateDashboardInsights,
  chatWithAssistant,
};