const { getPool, sql } = require('../config/database');

exports.getQuestions = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('test_id', sql.Int, req.params.testId)
      .query('SELECT * FROM Questions WHERE test_id=@test_id ORDER BY position');
    res.json(result.recordset.map(q => ({ ...q, options: JSON.parse(q.options || '[]') })));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { text, options, correct_answer, difficulty, points, position } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('test_id', sql.Int, req.params.testId)
      .input('text', sql.NVarChar(sql.MAX), text)
      .input('options', sql.NVarChar(sql.MAX), JSON.stringify(options))
      .input('correct_answer', sql.Int, correct_answer)
      .input('difficulty', sql.VarChar, difficulty || 'moyen')
      .input('points', sql.Int, points || 1)
      .input('position', sql.Int, position || 0)
      .query(`INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position)
              OUTPUT INSERTED.id VALUES (@test_id, @text, @options, @correct_answer, @difficulty, @points, @position)`);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { text, options, correct_answer, difficulty, points, position } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('text', sql.NVarChar(sql.MAX), text)
      .input('options', sql.NVarChar(sql.MAX), JSON.stringify(options))
      .input('correct_answer', sql.Int, correct_answer)
      .input('difficulty', sql.VarChar, difficulty)
      .input('points', sql.Int, points)
      .input('position', sql.Int, position)
      .query(`UPDATE Questions SET text=@text, options=@options, correct_answer=@correct_answer,
              difficulty=@difficulty, points=@points, position=@position WHERE id=@id`);
    res.json({ message: 'Question mise à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Questions WHERE id=@id');
    res.json({ message: 'Question supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
