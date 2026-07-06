const { getPool, sql } = require('../config/database');

exports.startSession = async (req, res) => {
  try {
    const { test_id, candidate_name, candidate_email, candidate_phone } = req.body;
    const pool = await getPool();
    
    // Récupérer les questions (sans réponses)
    const qResult = await pool.request()
      .input('test_id', sql.Int, test_id)
      .query('SELECT id, text, options, difficulty, points, position FROM Questions WHERE test_id=@test_id ORDER BY position');
    
    if (qResult.recordset.length === 0)
      return res.status(400).json({ message: 'Ce test ne contient aucune question' });
    
    const testResult = await pool.request()
      .input('id', sql.Int, test_id)
      .query('SELECT * FROM Tests WHERE id=@id AND is_active=1');
    const test = testResult.recordset[0];
    if (!test) return res.status(404).json({ message: 'Test non trouvé' });
    
    const expires_at = new Date(Date.now() + test.duration_minutes * 60 * 1000);
    
    const sessionResult = await pool.request()
      .input('test_id', sql.Int, test_id)
      .input('candidate_name', sql.VarChar, candidate_name)
      .input('candidate_email', sql.VarChar, candidate_email)
      .input('candidate_phone', sql.VarChar, candidate_phone || '')
      .input('expires_at', sql.DateTime, expires_at)
      .query(`INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, expires_at)
              OUTPUT INSERTED.id VALUES (@test_id, @candidate_name, @candidate_email, @candidate_phone, @expires_at)`);
    
    const session_id = sessionResult.recordset[0].id;
    const questions = qResult.recordset.map(q => ({
      ...q,
      options: JSON.parse(q.options || '[]')
    }));
    
    res.json({ session_id, test, questions, expires_at });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.submitSession = async (req, res) => {
  try {
    const { session_id, answers } = req.body;
    const pool = await getPool();
    
    const sessionResult = await pool.request()
      .input('id', sql.Int, session_id)
      .query('SELECT * FROM CandidateSessions WHERE id=@id');
    const session = sessionResult.recordset[0];
    
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    if (session.submitted_at) return res.status(400).json({ message: 'Test déjà soumis' });
    if (new Date() > new Date(session.expires_at))
      return res.status(400).json({ message: 'Temps expiré' });
    
    // Récupérer les questions avec réponses correctes
    const qResult = await pool.request()
      .input('test_id', sql.Int, session.test_id)
      .query('SELECT * FROM Questions WHERE test_id=@test_id');
    
    let total_points = 0, earned_points = 0;
    const detailed_answers = [];
    
    for (const q of qResult.recordset) {
      const candidate_answer = answers[q.id];
      const is_correct = candidate_answer == q.correct_answer;
      total_points += q.points;
      if (is_correct) earned_points += q.points;
      detailed_answers.push({ question_id: q.id, candidate_answer, correct_answer: q.correct_answer, is_correct, points: q.points });
    }
    
    const score = total_points > 0 ? Math.round((earned_points / total_points) * 100) : 0;
    const testResult = await pool.request().input('id', sql.Int, session.test_id).query('SELECT passing_score FROM Tests WHERE id=@id');
    const passing_score = testResult.recordset[0]?.passing_score || 70;
    const status = score >= passing_score ? 'réussi' : 'échoué';
    
    const time_taken = Math.round((new Date() - new Date(session.started_at || session.created_at)) / 1000);
    
    await pool.request()
      .input('id', sql.Int, session_id)
      .input('score', sql.Int, score)
      .input('earned_points', sql.Int, earned_points)
      .input('total_points', sql.Int, total_points)
      .input('status', sql.VarChar, status)
      .input('time_taken_seconds', sql.Int, time_taken)
      .input('answers_json', sql.NVarChar(sql.MAX), JSON.stringify(detailed_answers))
      .query(`UPDATE CandidateSessions SET score=@score, earned_points=@earned_points, total_points=@total_points,
              status=@status, time_taken_seconds=@time_taken_seconds, answers_json=@answers_json, submitted_at=GETDATE() WHERE id=@id`);
    
    res.json({ score, earned_points, total_points, status, time_taken, passing_score, detailed_answers });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const pool = await getPool();
    let query = `SELECT cs.*, t.title as test_title, t.category, t.passing_score
      FROM CandidateSessions cs JOIN Tests t ON cs.test_id = t.id`;
    const params = [];
    if (req.query.test_id) {
      query += ' WHERE cs.test_id=@test_id';
      params.push({ name: 'test_id', type: sql.Int, value: req.query.test_id });
    }
    query += ' ORDER BY cs.created_at DESC';
    const request = pool.request();
    params.forEach(p => request.input(p.name, p.type, p.value));
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT cs.*, t.title as test_title, t.category, t.passing_score, t.duration_minutes
              FROM CandidateSessions cs JOIN Tests t ON cs.test_id = t.id WHERE cs.id=@id`);
    const session = result.recordset[0];
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    if (session.answers_json) session.answers = JSON.parse(session.answers_json);
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
