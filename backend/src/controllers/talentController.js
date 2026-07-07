const { getPool, sql } = require('../config/database');
const { extractTextFromPdf } = require('../utils/pdfParser');
const {
  extractCVData,
  scoreCandidate,
  generateCandidateSummary,
  generateDashboardInsights,
} = require('../services/geminiService');

/**
 * L'IA (Groq) peut renvoyer un champ texte sous forme de tableau au lieu
 * d'une chaîne (ex: recommendation: ["...", "..."]), ce qui casse
 * l'insertion SQL (NVarChar attend une string). On normalise toujours.
 */
function toText(value) {
  if (Array.isArray(value)) return value.join('\n');
  if (value === null || value === undefined) return '';
  return String(value);
}

async function getJobOffer(pool, id) {
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM JobOffers WHERE id=@id');
  return result.recordset[0];
}

exports.uploadAndAnalyzeCVs = async (req, res) => {
  try {
    const jobOfferId = parseInt(req.params.offerId, 10);
    if (!req.files?.length) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }

    const pool = await getPool();
    const jobOffer = await getJobOffer(pool, jobOfferId);
    if (!jobOffer) return res.status(404).json({ message: 'Offre non trouvée' });

    const results = [];

    for (const file of req.files) {
      try {
        let cvText = '';
        try {
          cvText = await extractTextFromPdf(file.path);
        } catch (parseErr) {
          cvText = `CV PDF: ${file.originalname} (texte non extractible automatiquement)`;
        }

        const extracted = await extractCVData(cvText);
        const fullName = toText(extracted.full_name) || file.originalname.replace('.pdf', '');
        const email = extracted.email ? toText(extracted.email) : null;
        const phone = extracted.phone ? toText(extracted.phone) : null;

        const candidateResult = await pool.request()
          .input('full_name', sql.NVarChar, fullName)
          .input('email', sql.NVarChar, email)
          .input('phone', sql.NVarChar, phone)
          .query(`INSERT INTO Candidates (full_name, email, phone)
                  OUTPUT INSERTED.id VALUES (@full_name, @email, @phone)`);
        const candidateId = candidateResult.recordset[0].id;

        const cvResult = await pool.request()
          .input('candidate_id', sql.Int, candidateId)
          .input('file_name', sql.NVarChar, file.originalname)
          .input('mime_type', sql.NVarChar, file.mimetype)
          .input('file_path', sql.NVarChar, file.path)
          .input('text_content', sql.NVarChar(sql.MAX), cvText)
          .input('uploaded_by', sql.Int, req.user.id)
          .query(`INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
                  OUTPUT INSERTED.id VALUES (@candidate_id, @file_name, @mime_type, @file_path, @text_content, @uploaded_by)`);
        const cvId = cvResult.recordset[0].id;

        await pool.request()
          .input('cv_id', sql.Int, cvId)
          .input('extracted_json', sql.NVarChar(sql.MAX), JSON.stringify(extracted))
          .query(`INSERT INTO CandidateCVExtracts (cv_id, extracted_json)
                  VALUES (@cv_id, @extracted_json)`);

        const score = await scoreCandidate(jobOffer, extracted);
        const summary = await generateCandidateSummary(jobOffer, extracted, score);

        const appResult = await pool.request()
          .input('job_offer_id', sql.Int, jobOfferId)
          .input('candidate_id', sql.Int, candidateId)
          .input('cv_id', sql.Int, cvId)
          .input('ai_profile_summary', sql.NVarChar(sql.MAX), toText(summary.profile_summary))
          .input('ai_strengths_json', sql.NVarChar(sql.MAX), JSON.stringify(summary.strengths || []))
          .input('ai_weaknesses_json', sql.NVarChar(sql.MAX), JSON.stringify(summary.weaknesses || []))
          .input('ai_recommendation', sql.NVarChar, toText(summary.recommendation))
          .query(`INSERT INTO CandidateApplications (job_offer_id, candidate_id, cv_id,
                  ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
                  OUTPUT INSERTED.id VALUES (@job_offer_id, @candidate_id, @cv_id,
                  @ai_profile_summary, @ai_strengths_json, @ai_weaknesses_json, @ai_recommendation)`);
        const applicationId = appResult.recordset[0].id;

        await pool.request()
          .input('application_id', sql.Int, applicationId)
          .input('score_global', sql.Int, score.score_global || 0)
          .input('score_technical', sql.Int, score.score_technical || 0)
          .input('score_experience', sql.Int, score.score_experience || 0)
          .input('score_education', sql.Int, score.score_education || 0)
          .input('score_certifications', sql.Int, score.score_certifications || 0)
          .input('score_languages', sql.Int, score.score_languages || 0)
          .input('strengths_json', sql.NVarChar(sql.MAX), JSON.stringify(score.strengths || []))
          .input('missing_skills_json', sql.NVarChar(sql.MAX), JSON.stringify(score.missing_skills || []))
          .input('explanation', sql.NVarChar(sql.MAX), toText(score.explanation))
          .query(`INSERT INTO CandidateCompatibilityScores (application_id, score_global, score_technical,
                  score_experience, score_education, score_certifications, score_languages,
                  strengths_json, missing_skills_json, explanation)
                  VALUES (@application_id, @score_global, @score_technical, @score_experience,
                  @score_education, @score_certifications, @score_languages, @strengths_json,
                  @missing_skills_json, @explanation)`);

        results.push({
          application_id: applicationId,
          candidate_name: fullName,
          score_global: score.score_global,
          status: 'analyzed',
        });
      } catch (fileErr) {
        results.push({
          file: file.originalname,
          status: 'error',
          error: fileErr.message,
        });
      }
    }

    res.status(201).json({ message: 'Analyse terminée', results });
  } catch (err) {
    res.status(500).json({ message: 'Erreur analyse CV', error: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const pool = await getPool();
    const { job_offer_id, sort = 'score', skill, min_experience, diploma, min_score } = req.query;

    let query = `
      SELECT ca.id, ca.job_offer_id, ca.status, ca.ai_profile_summary, ca.ai_recommendation,
             ca.created_at, c.full_name, c.email, c.phone,
             jo.title AS job_title,
             ccs.score_global, ccs.score_technical, ccs.score_experience, ccs.score_education,
             ccs.score_certifications, ccs.score_languages,
             ccs.strengths_json, ccs.missing_skills_json, ccs.explanation,
             cce.extracted_json
      FROM CandidateApplications ca
      JOIN Candidates c ON ca.candidate_id = c.id
      JOIN JobOffers jo ON ca.job_offer_id = jo.id
      LEFT JOIN CandidateCompatibilityScores ccs ON ccs.application_id = ca.id
      LEFT JOIN CandidateCVExtracts cce ON cce.cv_id = ca.cv_id
      WHERE 1=1`;

    const request = pool.request();

    if (job_offer_id) {
      query += ' AND ca.job_offer_id = @job_offer_id';
      request.input('job_offer_id', sql.Int, parseInt(job_offer_id, 10));
    }
    if (min_score) {
      query += ' AND ccs.score_global >= @min_score';
      request.input('min_score', sql.Int, parseInt(min_score, 10));
    }

    query += ' ORDER BY ccs.score_global DESC';

    const result = await request.query(query);
    let rows = result.recordset.map((r) => ({
      ...r,
      strengths: r.strengths_json ? JSON.parse(r.strengths_json) : [],
      missing_skills: r.missing_skills_json ? JSON.parse(r.missing_skills_json) : [],
      extracted: r.extracted_json ? JSON.parse(r.extracted_json) : null,
    }));

    if (skill) {
      const skillLower = skill.toLowerCase();
      rows = rows.filter((r) => {
        const skills = [
          ...(r.strengths || []),
          ...(r.extracted?.technical_skills || []),
          ...(r.extracted?.technologies || []),
        ].map((s) => String(s).toLowerCase());
        return skills.some((s) => s.includes(skillLower));
      });
    }

    if (min_experience) {
      const minExp = parseInt(min_experience, 10);
      rows = rows.filter((r) => (r.extracted?.years_of_experience || 0) >= minExp);
    }

    if (diploma) {
      const diplomaLower = diploma.toLowerCase();
      rows = rows.filter((r) => {
        const diplomas = (r.extracted?.diplomas || []).map((d) => String(d).toLowerCase());
        const education = (r.extracted?.education || []).map((e) => `${e.degree || ''} ${e.school || ''}`.toLowerCase());
        return diplomas.some((d) => d.includes(diplomaLower)) || education.some((e) => e.includes(diplomaLower));
      });
    }

    if (sort === 'experience') {
      rows.sort((a, b) => (b.extracted?.years_of_experience || 0) - (a.extracted?.years_of_experience || 0));
    } else {
      rows.sort((a, b) => (b.score_global || 0) - (a.score_global || 0));
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ca.*, c.full_name, c.email, c.phone,
               jo.title AS job_title, jo.position, jo.level,
               cv.file_name, cv.file_path,
               ccs.*,
               cce.extracted_json
        FROM CandidateApplications ca
        JOIN Candidates c ON ca.candidate_id = c.id
        JOIN JobOffers jo ON ca.job_offer_id = jo.id
        JOIN CandidateCVs cv ON ca.cv_id = cv.id
        LEFT JOIN CandidateCompatibilityScores ccs ON ccs.application_id = ca.id
        LEFT JOIN CandidateCVExtracts cce ON cce.cv_id = ca.cv_id
        WHERE ca.id=@id`);

    const app = result.recordset[0];
    if (!app) return res.status(404).json({ message: 'Candidature non trouvée' });

    app.strengths = app.strengths_json ? JSON.parse(app.strengths_json) : [];
    app.missing_skills = app.missing_skills_json ? JSON.parse(app.missing_skills_json) : [];
    app.ai_strengths = app.ai_strengths_json ? JSON.parse(app.ai_strengths_json) : [];
    app.ai_weaknesses = app.ai_weaknesses_json ? JSON.parse(app.ai_weaknesses_json) : [];
    app.extracted = app.extracted_json ? JSON.parse(app.extracted_json) : null;

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getRanking = async (req, res) => {
  try {
    const pool = await getPool();
    const jobOfferId = req.params.offerId;

    const result = await pool.request()
      .input('job_offer_id', sql.Int, jobOfferId)
      .query(`
        SELECT TOP 20 c.full_name, ccs.score_global, ca.id AS application_id
        FROM CandidateApplications ca
        JOIN Candidates c ON ca.candidate_id = c.id
        JOIN CandidateCompatibilityScores ccs ON ccs.application_id = ca.id
        WHERE ca.job_offer_id = @job_offer_id
        ORDER BY ccs.score_global DESC`);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getTalentDashboard = async (req, res) => {
  try {
    const pool = await getPool();

    const stats = {};

    const r1 = await pool.request().query('SELECT COUNT(*) AS total FROM Candidates');
    stats.total_candidates = r1.recordset[0].total;

    const r2 = await pool.request().query("SELECT COUNT(*) AS total FROM JobOffers WHERE status='published' OR status='draft'");
    stats.total_offers = r2.recordset[0].total;

    const r3 = await pool.request().query('SELECT COUNT(*) AS total FROM CandidateSessions WHERE submitted_at IS NOT NULL');
    stats.total_tests = r3.recordset[0].total;

    const r4 = await pool.request().query('SELECT AVG(CAST(score_global AS FLOAT)) AS avg FROM CandidateCompatibilityScores');
    stats.avg_score = Math.round(r4.recordset[0].avg || 0);

    const r5 = await pool.request().query(`
      SELECT COUNT(*) AS total FROM CandidateApplications ca
      JOIN CandidateCompatibilityScores ccs ON ccs.application_id = ca.id
      WHERE ccs.score_global >= 80`);
    stats.recommended_candidates = r5.recordset[0].total;

    const r6 = await pool.request().query(`
      SELECT cce.extracted_json FROM CandidateCVExtracts cce`);
    const skillCounts = {};
    const techCounts = {};
    const levelCounts = { junior: 0, intermediaire: 0, senior: 0 };

    for (const row of r6.recordset) {
      try {
        const data = JSON.parse(row.extracted_json);
        (data.technical_skills || []).forEach((s) => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
        (data.technologies || []).forEach((t) => {
          techCounts[t] = (techCounts[t] || 0) + 1;
        });
        const years = data.years_of_experience || 0;
        if (years <= 2) levelCounts.junior += 1;
        else if (years <= 5) levelCounts.intermediaire += 1;
        else levelCounts.senior += 1;
      } catch { /* ignore */ }
    }

    stats.skills_distribution = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    stats.technologies_distribution = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    stats.level_distribution = levelCounts;

    const r7 = await pool.request().query(`
      SELECT FORMAT(ca.created_at, 'yyyy-MM') AS month, COUNT(*) AS count
      FROM CandidateApplications ca
      GROUP BY FORMAT(ca.created_at, 'yyyy-MM')
      ORDER BY month`);
    stats.recruitment_evolution = r7.recordset;

    let insights = [];
    try {
      const insightResult = await generateDashboardInsights(stats);
      insights = insightResult.insights || [];
    } catch {
      insights = [
        `${stats.recommended_candidates} candidat(s) correspondent fortement aux offres.`,
        `Score moyen de compatibilité : ${stats.avg_score}%.`,
      ];
    }
    stats.insights = insights;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Erreur dashboard', error: err.message });
  }
};