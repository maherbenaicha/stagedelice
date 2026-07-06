const { getPool, sql } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.getTests = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT t.*, u.full_name as created_by_name,
        (SELECT COUNT(*) FROM Questions q WHERE q.test_id = t.id) as question_count,
        (SELECT COUNT(*) FROM CandidateSessions cs WHERE cs.test_id = t.id) as session_count
        FROM Tests t LEFT JOIN Users u ON t.created_by = u.id ORDER BY t.created_at DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getTest = async (req, res) => {
  try {
    const pool = await getPool();
    const testResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Tests WHERE id=@id');
    if (!testResult.recordset[0]) return res.status(404).json({ message: 'Test non trouvé' });
    
    const qResult = await pool.request()
      .input('test_id', sql.Int, req.params.id)
      .query('SELECT * FROM Questions WHERE test_id=@test_id ORDER BY position');
    
    const test = testResult.recordset[0];
    test.questions = qResult.recordset.map(q => ({
      ...q,
      options: JSON.parse(q.options || '[]')
    }));
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { title, description, duration_minutes, passing_score, category } = req.body;
    const access_code = uuidv4().substring(0, 8).toUpperCase();
    const pool = await getPool();
    const result = await pool.request()
      .input('title', sql.VarChar, title)
      .input('description', sql.VarChar, description)
      .input('duration_minutes', sql.Int, duration_minutes || 60)
      .input('passing_score', sql.Int, passing_score || 70)
      .input('category', sql.VarChar, category)
      .input('access_code', sql.VarChar, access_code)
      .input('created_by', sql.Int, req.user.id)
      .query(`INSERT INTO Tests (title, description, duration_minutes, passing_score, category, access_code, created_by)
              OUTPUT INSERTED.id VALUES (@title, @description, @duration_minutes, @passing_score, @category, @access_code, @created_by)`);
    res.status(201).json({ id: result.recordset[0].id, access_code });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { title, description, duration_minutes, passing_score, category, is_active } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.VarChar, title)
      .input('description', sql.VarChar, description)
      .input('duration_minutes', sql.Int, duration_minutes)
      .input('passing_score', sql.Int, passing_score)
      .input('category', sql.VarChar, category)
      .input('is_active', sql.Bit, is_active)
      .query(`UPDATE Tests SET title=@title, description=@description, duration_minutes=@duration_minutes,
              passing_score=@passing_score, category=@category, is_active=@is_active WHERE id=@id`);
    res.json({ message: 'Test mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Tests SET is_active=0 WHERE id=@id');
    res.json({ message: 'Test désactivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getTestByCode = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('code', sql.VarChar, req.params.code.toUpperCase())
      .query('SELECT id, title, description, duration_minutes, category FROM Tests WHERE access_code=@code AND is_active=1');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Code invalide ou test inactif' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
