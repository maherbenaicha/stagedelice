/**
 * seed-demo-full.js
 * -----------------------------------------------------------------------
 * Remplit StageDélice avec des données de démo réalistes :
 *   - 6 tests (un par catégorie utilisée dans le front : SQL, Web, Réseau,
 *     Algorithmique, ERP, DevOps), chacun avec 5 questions QCM variées.
 *   - Plusieurs sessions candidats par test (réponses, score, statut,
 *     temps pris, date), pour peupler Dashboard / Candidats / Rapports.
 *
 * Idempotent : relance sans risque, un test avec le même titre n'est
 * jamais recréé (mais ses sessions de démo ne sont pas dédupliquées —
 * ne lance ce script qu'une fois, ou nettoie manuellement si besoin).
 *
 * Usage (depuis backend/) :
 *   node src/utils/seed-demo-full.js
 * -----------------------------------------------------------------------
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'TechTestDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: { encrypt: false, trustServerCertificate: true },
};

// ---------------------------------------------------------------------
// Données des 6 tests de démo
// ---------------------------------------------------------------------
const TESTS = [
  {
    title: 'Test SQL - Requêtes et Bases de données',
    description: "Évaluation des bases du langage SQL : requêtes, jointures, agrégations.",
    category: 'SQL',
    duration_minutes: 30,
    passing_score: 60,
    access_code: 'SQL2024',
    questions: [
      { text: "Quelle instruction permet de récupérer des données d'une table ?", options: ['GET', 'SELECT', 'FETCH', 'READ'], correct_answer: 1, difficulty: 'facile', points: 1 },
      { text: "Quelle clause permet de filtrer des lignes selon une condition ?", options: ['ORDER BY', 'GROUP BY', 'WHERE', 'HAVING'], correct_answer: 2, difficulty: 'facile', points: 1 },
      { text: "Quel type de jointure retourne uniquement les lignes correspondant dans les deux tables ?", options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'], correct_answer: 2, difficulty: 'moyen', points: 2 },
      { text: "Quelle clause filtre les résultats après un GROUP BY ?", options: ['WHERE', 'HAVING', 'FILTER', 'ON'], correct_answer: 1, difficulty: 'moyen', points: 2 },
      { text: "Que garantit une transaction respectant les propriétés ACID en cas de panne ?", options: ["Rien de particulier", "La cohérence et la durabilité des données", "Une exécution plus rapide", "La suppression automatique des données"], correct_answer: 1, difficulty: 'difficile', points: 3 },
    ],
  },
  {
    title: 'Test Web - JavaScript & React',
    description: "Évaluation des connaissances JavaScript moderne et React pour développeurs front-end.",
    category: 'Web',
    duration_minutes: 35,
    passing_score: 65,
    access_code: 'WEB2024',
    questions: [
      { text: "Quel mot-clé déclare une variable dont la référence ne peut pas être réassignée ?", options: ['var', 'let', 'const', 'static'], correct_answer: 2, difficulty: 'facile', points: 1 },
      { text: "Quelle méthode transforme chaque élément d'un tableau en un nouveau tableau ?", options: ['forEach()', 'map()', 'filter()', 'reduce()'], correct_answer: 1, difficulty: 'facile', points: 1 },
      { text: "Dans React, quel Hook permet de gérer un état local dans un composant fonction ?", options: ['useEffect', 'useState', 'useRef', 'useContext'], correct_answer: 1, difficulty: 'moyen', points: 2 },
      { text: "À quoi sert le tableau de dépendances du Hook useEffect ?", options: ["À trier les props", "À contrôler quand l'effet se ré-exécute", "À déclarer le state initial", "À optimiser le CSS"], correct_answer: 1, difficulty: 'moyen', points: 2 },
      { text: "Que retourne Promise.all() lorsqu'une des promesses est rejetée ?", options: ["Le résultat des autres promesses uniquement", "Une promesse rejetée avec la première erreur rencontrée", "undefined", "Un tableau vide"], correct_answer: 1, difficulty: 'difficile', points: 3 },
    ],
  },
  {
    title: 'Test Réseau - Fondamentaux TCP/IP',
    description: "Évaluation des notions de base en réseaux informatiques et protocoles.",
    category: 'Réseau',
    duration_minutes: 25,
    passing_score: 60,
    access_code: 'RES2024',
    questions: [
      { text: "Combien de couches compte le modèle OSI ?", options: ['4', '5', '7', '9'], correct_answer: 2, difficulty: 'facile', points: 1 },
      { text: "Quel protocole assure une transmission fiable avec accusé de réception ?", options: ['UDP', 'TCP', 'ICMP', 'ARP'], correct_answer: 1, difficulty: 'facile', points: 1 },
      { text: "Quel port est utilisé par défaut pour le protocole HTTPS ?", options: ['80', '21', '443', '25'], correct_answer: 2, difficulty: 'moyen', points: 2 },
      { text: "Quel équipement permet de segmenter un réseau en plusieurs domaines de diffusion ?", options: ['Hub', 'Switch', 'Routeur', 'Répéteur'], correct_answer: 2, difficulty: 'moyen', points: 2 },
      { text: "Que signifie l'acronyme NAT en réseau ?", options: ["Network Access Terminal", "Network Address Translation", "New Address Table", "Network Allocation Type"], correct_answer: 1, difficulty: 'difficile', points: 3 },
    ],
  },
  {
    title: 'Test Algorithmique - Structures de données',
    description: "Évaluation de la logique algorithmique et des structures de données fondamentales.",
    category: 'Algorithmique',
    duration_minutes: 40,
    passing_score: 65,
    access_code: 'ALG2024',
    questions: [
      { text: "Quelle est la complexité moyenne d'une recherche dans un tableau trié par dichotomie ?", options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correct_answer: 2, difficulty: 'moyen', points: 2 },
      { text: "Quelle structure de données fonctionne selon le principe FIFO (premier entré, premier sorti) ?", options: ['Pile (Stack)', 'File (Queue)', 'Arbre binaire', 'Table de hachage'], correct_answer: 1, difficulty: 'facile', points: 1 },
      { text: "Quel algorithme de tri a une complexité moyenne de O(n log n) ?", options: ['Tri à bulles', 'Tri par sélection', 'Tri rapide (Quicksort)', 'Tri par insertion'], correct_answer: 2, difficulty: 'moyen', points: 2 },
      { text: "Dans une liste chaînée simple, quel est le coût d'accès au n-ième élément ?", options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct_answer: 2, difficulty: 'facile', points: 1 },
      { text: "Quelle structure est la plus adaptée pour implémenter un parcours en largeur (BFS) ?", options: ['Pile (Stack)', 'File (Queue)', 'Tableau trié', 'Table de hachage'], correct_answer: 1, difficulty: 'difficile', points: 3 },
    ],
  },
  {
    title: 'Test ERP/SAP - Notions de base',
    description: "Évaluation des concepts fondamentaux des systèmes ERP et de SAP.",
    category: 'ERP',
    duration_minutes: 30,
    passing_score: 60,
    access_code: 'ERP2024',
    questions: [
      { text: "Que signifie l'acronyme ERP ?", options: ["Enterprise Resource Planning", "Enterprise Report Processing", "External Resource Program", "Enterprise Registration Portal"], correct_answer: 0, difficulty: 'facile', points: 1 },
      { text: "Quel module SAP gère typiquement les achats et la gestion des stocks ?", options: ['FI (Finance)', 'MM (Materials Management)', 'HR (Human Resources)', 'SD (Sales & Distribution)'], correct_answer: 1, difficulty: 'moyen', points: 2 },
      { text: "Quel est l'un des principaux avantages d'un ERP pour une entreprise ?", options: ["Multiplier les bases de données isolées", "Centraliser les processus et les données", "Supprimer le besoin de reporting", "Réduire le nombre d'utilisateurs autorisés"], correct_answer: 1, difficulty: 'facile', points: 1 },
      { text: "Dans SAP, que représente un 'client' (mandant) ?", options: ["Un utilisateur final", "Une unité organisationnelle indépendante avec ses propres données", "Un rapport financier", "Un type de licence"], correct_answer: 1, difficulty: 'difficile', points: 3 },
      { text: "Quel module SAP est dédié à la gestion financière et comptable ?", options: ['MM', 'PP', 'FI', 'QM'], correct_answer: 2, difficulty: 'moyen', points: 2 },
    ],
  },
  {
    title: 'Test DevOps - CI/CD & Conteneurs',
    description: "Évaluation des pratiques DevOps : intégration continue, conteneurisation, déploiement.",
    category: 'DevOps',
    duration_minutes: 30,
    passing_score: 65,
    access_code: 'DEVOPS24',
    questions: [
      { text: "Que signifie CI/CD ?", options: ["Continuous Integration / Continuous Delivery", "Code Inspection / Code Deployment", "Central Index / Central Data", "Container Integration / Container Deployment"], correct_answer: 0, difficulty: 'facile', points: 1 },
      { text: "Quel outil est le plus associé à la conteneurisation d'applications ?", options: ['Docker', 'Jenkins', 'Git', 'Jira'], correct_answer: 0, difficulty: 'facile', points: 1 },
      { text: "À quoi sert principalement Kubernetes ?", options: ["Gérer le versionnement du code", "Orchestrer et gérer des conteneurs à grande échelle", "Compiler du code Java", "Envoyer des emails automatiques"], correct_answer: 1, difficulty: 'moyen', points: 2 },
      { text: "Dans un pipeline CI/CD, à quel moment les tests automatisés s'exécutent-ils généralement ?", options: ["Jamais, ils sont manuels", "Après chaque déploiement en production uniquement", "À chaque intégration de code (build)", "Une seule fois par an"], correct_answer: 2, difficulty: 'moyen', points: 2 },
      { text: "Quel est l'intérêt principal d'une stratégie de déploiement Blue-Green ?", options: ["Réduire la taille du code", "Basculer le trafic entre deux environnements pour un déploiement sans interruption", "Supprimer le besoin de tests", "Accélérer la compilation"], correct_answer: 1, difficulty: 'difficile', points: 3 },
    ],
  },
];

// ---------------------------------------------------------------------
// Pool de candidats fictifs pour générer des sessions variées
// ---------------------------------------------------------------------
const CANDIDATES = [
  ['Amine Ben Salah', 'amine.bensalah@example.com'],
  ['Yasmine Trabelsi', 'yasmine.trabelsi@example.com'],
  ['Mehdi Gharbi', 'mehdi.gharbi@example.com'],
  ['Sarra Jendoubi', 'sarra.jendoubi@example.com'],
  ['Karim Bouzid', 'karim.bouzid@example.com'],
  ['Nour Ayari', 'nour.ayari@example.com'],
  ['Fares Chaabane', 'fares.chaabane@example.com'],
  ['Ines Mansour', 'ines.mansour@example.com'],
  ['Walid Kacem', 'walid.kacem@example.com'],
  ['Emna Sfaxi', 'emna.sfaxi@example.com'],
  ['Youssef Hamdi', 'youssef.hamdi@example.com'],
  ['Rania Belhaj', 'rania.belhaj@example.com'],
  ['Anis Zoghlami', 'anis.zoghlami@example.com'],
  ['Dorra Khemiri', 'dorra.khemiri@example.com'],
  ['Slim Ferjani', 'slim.ferjani@example.com'],
  ['Mariem Ouertani', 'mariem.ouertani@example.com'],
  ['Bilel Rekik', 'bilel.rekik@example.com'],
  ['Hela Bouazizi', 'hela.bouazizi@example.com'],
  ['Aymen Cherif', 'aymen.cherif@example.com'],
  ['Salma Khelifi', 'salma.khelifi@example.com'],
  ['Nizar Guesmi', 'nizar.guesmi@example.com'],
  ['Chaima Njeh', 'chaima.njeh@example.com'],
  ['Bassem Ouni', 'bassem.ouni@example.com'],
  ['Amira Souissi', 'amira.souissi@example.com'],
];

const SESSIONS_PER_TEST = 4; // -> 6 tests * 4 = 24 sessions au total

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

async function seedTest(pool, adminId, testDef) {
  const existing = await pool.request()
    .input('title', sql.NVarChar, testDef.title)
    .input('access_code', sql.VarChar, testDef.access_code)
    .query('SELECT id FROM Tests WHERE title=@title OR access_code=@access_code');

  let testId;
  if (existing.recordset.length > 0) {
    testId = existing.recordset[0].id;
    console.log(`↷ Test déjà présent (même titre ou même code) : "${testDef.title}" (id=${testId}) — questions/sessions ignorées.`);
    return null; // ne rien recréer pour ce test
  }

  const testResult = await pool.request()
    .input('title', sql.NVarChar, testDef.title)
    .input('description', sql.NVarChar(sql.MAX), testDef.description)
    .input('category', sql.VarChar, testDef.category)
    .input('duration_minutes', sql.Int, testDef.duration_minutes)
    .input('passing_score', sql.Int, testDef.passing_score)
    .input('access_code', sql.VarChar, testDef.access_code)
    .input('created_by', sql.Int, adminId)
    .query(`INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
            OUTPUT INSERTED.id VALUES (@title, @description, @category, @duration_minutes, @passing_score, @access_code, @created_by)`);
  testId = testResult.recordset[0].id;
  console.log(`✅ Test créé : "${testDef.title}" (code: ${testDef.access_code})`);

  const questionIds = [];
  for (let i = 0; i < testDef.questions.length; i++) {
    const q = testDef.questions[i];
    const qResult = await pool.request()
      .input('test_id', sql.Int, testId)
      .input('text', sql.NVarChar(sql.MAX), q.text)
      .input('options', sql.NVarChar(sql.MAX), JSON.stringify(q.options))
      .input('correct_answer', sql.Int, q.correct_answer)
      .input('difficulty', sql.VarChar, q.difficulty)
      .input('points', sql.Int, q.points)
      .input('position', sql.Int, i + 1)
      .query(`INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position)
              OUTPUT INSERTED.id VALUES (@test_id, @text, @options, @correct_answer, @difficulty, @points, @position)`);
    questionIds.push(qResult.recordset[0].id);
  }
  console.log(`   ↳ ${questionIds.length} questions insérées.`);

  return { testId, questions: testDef.questions.map((q, i) => ({ ...q, id: questionIds[i] })), duration_minutes: testDef.duration_minutes, passing_score: testDef.passing_score };
}

async function seedSessionsForTest(pool, test) {
  const totalPoints = test.questions.reduce((s, q) => s + q.points, 0);
  const usedCandidates = new Set();

  for (let i = 0; i < SESSIONS_PER_TEST; i++) {
    let candidate;
    do { candidate = pick(CANDIDATES); } while (usedCandidates.has(candidate[1]) && usedCandidates.size < CANDIDATES.length);
    usedCandidates.add(candidate[1]);
    const [name, email] = candidate;

    // Niveau de compétence simulé du candidat (0.2 = faible, 0.95 = excellent)
    const skill = randInt(20, 95) / 100;

    let earnedPoints = 0;
    const detailedAnswers = [];
    for (const q of test.questions) {
      const isCorrect = Math.random() < skill;
      const candidateAnswer = isCorrect ? q.correct_answer : (q.correct_answer + 1) % q.options.length;
      if (isCorrect) earnedPoints += q.points;
      detailedAnswers.push({ question_id: q.id, candidate_answer: candidateAnswer, correct_answer: q.correct_answer, is_correct: isCorrect, points: q.points });
    }

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const status = score >= test.passing_score ? 'passed' : 'failed';

    const daysAgo = randInt(0, 21);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - randInt(0, 12) * 60 * 60 * 1000);
    const maxSeconds = test.duration_minutes * 60;
    const timeTaken = randInt(Math.floor(maxSeconds * 0.35), Math.floor(maxSeconds * 0.95));
    const submittedAt = new Date(createdAt.getTime() + timeTaken * 1000);
    const expiresAt = new Date(createdAt.getTime() + maxSeconds * 1000);

    await pool.request()
      .input('test_id', sql.Int, test.testId)
      .input('candidate_name', sql.VarChar, name)
      .input('candidate_email', sql.VarChar, email)
      .input('candidate_phone', sql.VarChar, `+216 ${randInt(20, 99)} ${randInt(100, 999)} ${randInt(100, 999)}`)
      .input('score', sql.Int, score)
      .input('earned_points', sql.Int, earnedPoints)
      .input('total_points', sql.Int, totalPoints)
      .input('status', sql.VarChar, status)
      .input('time_taken_seconds', sql.Int, timeTaken)
      .input('answers_json', sql.NVarChar(sql.MAX), JSON.stringify(detailedAnswers))
      .input('expires_at', sql.DateTime, expiresAt)
      .input('created_at', sql.DateTime, createdAt)
      .input('submitted_at', sql.DateTime, submittedAt)
      .query(`INSERT INTO CandidateSessions
                (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points,
                 status, time_taken_seconds, answers_json, expires_at, created_at, submitted_at)
              VALUES
                (@test_id, @candidate_name, @candidate_email, @candidate_phone, @score, @earned_points, @total_points,
                 @status, @time_taken_seconds, @answers_json, @expires_at, @created_at, @submitted_at)`);
  }
  console.log(`   ↳ ${SESSIONS_PER_TEST} sessions candidats insérées (score moyen visible dans le Dashboard).`);
}

async function main() {
  console.log(`Connexion à SQL Server (${config.server})...`);
  const pool = await sql.connect(config);

  try {
    const adminResult = await pool.request().query("SELECT id FROM Users WHERE email = 'admin@stagedelice.com'");
    if (adminResult.recordset.length === 0) {
      throw new Error("Utilisateur admin@stagedelice.com introuvable — lance d'abord 'npm run seed' pour initialiser la base.");
    }
    const adminId = adminResult.recordset[0].id;

    for (const testDef of TESTS) {
      const created = await seedTest(pool, adminId, testDef);
      if (created) await seedSessionsForTest(pool, created);
    }

    console.log('\n✅ Données de démo insérées avec succès.');
    console.log('   Codes d\'accès candidats : ' + TESTS.map(t => t.access_code).join(', '));
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error('❌ Échec du seed de démo :', err.message);
  process.exit(1);
});