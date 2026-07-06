const { getPool, sql } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.getDashboard = async (req, res) => {
  try {
    const pool = await getPool();
    const stats = {};
    
    const r1 = await pool.request().query('SELECT COUNT(*) as total FROM Tests WHERE is_active=1');
    stats.total_tests = r1.recordset[0].total;
    
    const r2 = await pool.request().query('SELECT COUNT(*) as total FROM CandidateSessions WHERE submitted_at IS NOT NULL');
    stats.total_sessions = r2.recordset[0].total;
    
    const r3 = await pool.request().query(`SELECT COUNT(*) as total FROM CandidateSessions WHERE status='réussi'`);
    stats.total_passed = r3.recordset[0].total;
    
    const r4 = await pool.request().query('SELECT AVG(CAST(score as FLOAT)) as avg FROM CandidateSessions WHERE submitted_at IS NOT NULL');
    stats.avg_score = Math.round(r4.recordset[0].avg || 0);
    
    const r5 = await pool.request().query(`
      SELECT t.title, t.category, COUNT(cs.id) as sessions,
        AVG(CAST(cs.score as FLOAT)) as avg_score,
        SUM(CASE WHEN cs.status='réussi' THEN 1 ELSE 0 END) as passed
      FROM Tests t LEFT JOIN CandidateSessions cs ON t.id=cs.test_id AND cs.submitted_at IS NOT NULL
      WHERE t.is_active=1 GROUP BY t.id, t.title, t.category ORDER BY sessions DESC`);
    stats.tests_stats = r5.recordset;
    
    const r6 = await pool.request().query(`
      SELECT TOP 10 candidate_name, candidate_email, t.title, cs.score, cs.status, cs.created_at
      FROM CandidateSessions cs JOIN Tests t ON cs.test_id=t.id
      WHERE cs.submitted_at IS NOT NULL ORDER BY cs.created_at DESC`);
    stats.recent_sessions = r6.recordset;
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT cs.id, cs.candidate_name, cs.candidate_email, cs.candidate_phone,
        t.title as test_title, t.category, cs.score, cs.status,
        cs.earned_points, cs.total_points, cs.time_taken_seconds, cs.created_at
      FROM CandidateSessions cs JOIN Tests t ON cs.test_id=t.id
      WHERE cs.submitted_at IS NOT NULL ORDER BY cs.created_at DESC`);
    
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Résultats');
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Candidat', key: 'candidate_name', width: 25 },
      { header: 'Email', key: 'candidate_email', width: 30 },
      { header: 'Téléphone', key: 'candidate_phone', width: 18 },
      { header: 'Test', key: 'test_title', width: 30 },
      { header: 'Catégorie', key: 'category', width: 15 },
      { header: 'Score (%)', key: 'score', width: 12 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Points obtenus', key: 'earned_points', width: 15 },
      { header: 'Points total', key: 'total_points', width: 13 },
      { header: 'Temps (s)', key: 'time_taken_seconds', width: 12 },
      { header: 'Date', key: 'created_at', width: 20 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    result.recordset.forEach(r => ws.addRow(r));
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=resultats.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Erreur export', error: err.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT cs.candidate_name, cs.candidate_email, t.title as test_title,
        cs.score, cs.status, cs.time_taken_seconds, cs.created_at
      FROM CandidateSessions cs JOIN Tests t ON cs.test_id=t.id
      WHERE cs.submitted_at IS NOT NULL ORDER BY cs.created_at DESC`);
    
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resultats.pdf');
    doc.pipe(res);
    
    doc.fontSize(20).text('Rapport des Résultats', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown();
    
    result.recordset.forEach((r, i) => {
      doc.fontSize(11).text(`${i + 1}. ${r.candidate_name} (${r.candidate_email})`);
      doc.fontSize(9).text(`   Test: ${r.test_title} | Score: ${r.score}% | Statut: ${r.status}`);
      doc.moveDown(0.3);
    });
    
    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Erreur export PDF' });
  }
};
