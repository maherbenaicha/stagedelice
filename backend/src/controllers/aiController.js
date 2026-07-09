const { getPool, sql } = require('../config/database');
const { generateQuestions, chatWithAssistant } = require('../services/geminiService');

/**
 * POST /api/ai/generate-questions
 * Body: { technology, level, count, test_id?, save? }
 *
 * Generates QCM questions with Gemini. If `test_id` and `save: true`
 * are provided, the generated questions are persisted directly into
 * that test (positioned after any existing questions). Otherwise the
 * questions are returned for the recruiter to review before saving.
 */
exports.generate = async (req, res) => {
  try {
    const { technology, level = 'moyen', count = 5, test_id, save = false } = req.body;

    if (!technology) {
      return res.status(400).json({ message: 'Le champ "technology" est requis' });
    }

    const questions = await generateQuestions({
      technology,
      level,
      count: Math.min(Math.max(Number(count) || 5, 1), 15), // clamp 1-15
    });

    if (!save) {
      return res.json({ questions });
    }

    if (!test_id) {
      return res.status(400).json({ message: 'test_id est requis pour enregistrer les questions' });
    }

    const pool = await getPool();

    const posResult = await pool.request()
      .input('test_id', sql.Int, test_id)
      .query('SELECT ISNULL(MAX(position), 0) as maxPos FROM Questions WHERE test_id=@test_id');
    let position = posResult.recordset[0].maxPos;

    const insertedIds = [];
    for (const q of questions) {
      position += 1;
      const result = await pool.request()
        .input('test_id', sql.Int, test_id)
        .input('text', sql.NVarChar(sql.MAX), q.text)
        .input('options', sql.NVarChar(sql.MAX), JSON.stringify(q.options))
        .input('correct_answer', sql.Int, q.correct_answer)
        .input('difficulty', sql.VarChar, q.difficulty)
        .input('points', sql.Int, q.points)
        .input('position', sql.Int, position)
        .query(`INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position)
                OUTPUT INSERTED.id VALUES (@test_id, @text, @options, @correct_answer, @difficulty, @points, @position)`);
      insertedIds.push(result.recordset[0].id);
    }

    res.status(201).json({ message: 'Questions générées et enregistrées', count: insertedIds.length, ids: insertedIds });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la génération des questions', error: err.message });
  }
};

/**
 * POST /api/ai/chat
 * Body: { message, history? }
 *
 * Assistant conversationnel pour la RH. Interroge la base en LECTURE SEULE
 * pour construire un instantané des données actuelles (tests, sessions,
 * candidats, offres, candidatures), puis transmet ce contexte au modèle.
 * Le modèle n'a jamais d'accès direct à la base.
 */
exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Le champ "message" est requis' });
    }

    const pool = await getPool();
    const context = {};

    const r1 = await pool.request().query('SELECT COUNT(*) AS total FROM Tests WHERE is_active=1');
    context.total_tests_actifs = r1.recordset[0].total;

    const r2 = await pool.request().query('SELECT COUNT(*) AS total FROM CandidateSessions WHERE submitted_at IS NOT NULL');
    context.total_sessions_soumises = r2.recordset[0].total;

    const r3 = await pool.request().query(`SELECT COUNT(*) AS total FROM CandidateSessions WHERE status='réussi'`);
    context.total_sessions_reussies = r3.recordset[0].total;

    const r4 = await pool.request().query('SELECT AVG(CAST(score AS FLOAT)) AS avg FROM CandidateSessions WHERE submitted_at IS NOT NULL');
    context.score_moyen_tests = Math.round(r4.recordset[0].avg || 0);

    const r5 = await pool.request().query(`
      SELECT t.title, t.category, COUNT(cs.id) AS sessions,
        AVG(CAST(cs.score AS FLOAT)) AS score_moyen,
        SUM(CASE WHEN cs.status='réussi' THEN 1 ELSE 0 END) AS reussis
      FROM Tests t LEFT JOIN CandidateSessions cs ON t.id=cs.test_id AND cs.submitted_at IS NOT NULL
      WHERE t.is_active=1
      GROUP BY t.id, t.title, t.category`);
    context.stats_par_test = r5.recordset.map((r) => ({ ...r, score_moyen: Math.round(r.score_moyen || 0) }));

    const r6 = await pool.request().query(`
      SELECT TOP 8 cs.candidate_name, cs.candidate_email, t.title, cs.score, cs.status, cs.created_at
      FROM CandidateSessions cs JOIN Tests t ON cs.test_id=t.id
      WHERE cs.submitted_at IS NOT NULL
      ORDER BY cs.created_at DESC`);
    context.sessions_recentes = r6.recordset;

    const r7 = await pool.request().query('SELECT COUNT(*) AS total FROM Candidates');
    context.total_candidats_talent = r7.recordset[0].total;

    const r8 = await pool.request().query('SELECT status, COUNT(*) AS total FROM JobOffers GROUP BY status');
    context.offres_par_statut = r8.recordset;

    const r9 = await pool.request().query('SELECT status, COUNT(*) AS total FROM CandidateApplications GROUP BY status');
    context.candidatures_par_statut = r9.recordset;

    const r10 = await pool.request().query(`
      SELECT TOP 8 c.full_name, jo.title AS offre, ca.status, ccs.score_global
      FROM CandidateApplications ca
      JOIN Candidates c ON c.id = ca.candidate_id
      JOIN JobOffers jo ON jo.id = ca.job_offer_id
      LEFT JOIN CandidateCompatibilityScores ccs ON ccs.application_id = ca.id
      ORDER BY ca.created_at DESC`);
    context.candidatures_recentes = r10.recordset;

    const reply = await chatWithAssistant({ message, history, context });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la génération de la réponse de l'assistant", error: err.message });
  }
};