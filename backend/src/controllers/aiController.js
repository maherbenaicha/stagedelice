const { getPool, sql } = require('../config/database');
const { generateQuestions } = require('../services/geminiService');

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
