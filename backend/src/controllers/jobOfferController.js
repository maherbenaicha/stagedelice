const { getPool, sql } = require('../config/database');
const {
  generateJobOffer,
  generateRecruitmentPipeline,
} = require('../services/geminiService');

/**
 * L'IA (Groq) renvoie parfois un champ texte sous forme de tableau
 * (ex: missions: ["...", "..."]) au lieu d'une chaîne, ce qui casse
 * l'insertion SQL (NVarChar attend une string). On normalise toujours
 * ces champs en texte avant de les utiliser, qu'ils viennent de l'IA
 * ou directement du formulaire du recruteur.
 */
function toText(value) {
  if (Array.isArray(value)) return value.join('\n');
  if (value === null || value === undefined) return '';
  return String(value);
}

exports.getOffers = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT jo.*, u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM CandidateApplications ca WHERE ca.job_offer_id = jo.id) AS candidate_count
      FROM JobOffers jo
      LEFT JOIN Users u ON jo.created_by = u.id
      ORDER BY jo.created_at DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getOffer = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM JobOffers WHERE id=@id');
    const offer = result.recordset[0];
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });

    const pipelineResult = await pool.request()
      .input('job_offer_id', sql.Int, offer.id)
      .query('SELECT * FROM RecruitmentPipelines WHERE job_offer_id=@job_offer_id');
    offer.pipeline = pipelineResult.recordset[0] || null;
    if (offer.pipeline?.steps_json) {
      offer.pipeline.steps = JSON.parse(offer.pipeline.steps_json);
    }
    if (offer.required_skills_json) offer.required_skills = JSON.parse(offer.required_skills_json);
    if (offer.recommended_questions_json) offer.recommended_questions = JSON.parse(offer.recommended_questions_json);

    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.generateOffer = async (req, res) => {
  try {
    const { position, level, technologies } = req.body;
    if (!position) return res.status(400).json({ message: 'Le champ "position" est requis' });

    const generated = await generateJobOffer({ position, level, technologies: technologies || '' });
    res.json({ generated, position, level, technologies });
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération offre', error: err.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const {
      title, position, level, technologies, description, missions,
      responsibilities, required_skills, desired_profile, recommended_questions, status,
    } = req.body;

    if (!title || !position) {
      return res.status(400).json({ message: 'title et position sont requis' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('position', sql.NVarChar, position)
      .input('level', sql.NVarChar, level || '')
      .input('technologies', sql.NVarChar(sql.MAX), toText(technologies))
      .input('description', sql.NVarChar(sql.MAX), toText(description))
      .input('missions', sql.NVarChar(sql.MAX), toText(missions))
      .input('responsibilities', sql.NVarChar(sql.MAX), toText(responsibilities))
      .input('required_skills_json', sql.NVarChar(sql.MAX), JSON.stringify(required_skills || []))
      .input('desired_profile', sql.NVarChar(sql.MAX), toText(desired_profile))
      .input('recommended_questions_json', sql.NVarChar(sql.MAX), JSON.stringify(recommended_questions || []))
      .input('status', sql.NVarChar, status || 'draft')
      .input('created_by', sql.Int, req.user.id)
      .query(`INSERT INTO JobOffers (title, position, level, technologies, description, missions,
              responsibilities, required_skills_json, desired_profile, recommended_questions_json, status, created_by)
              OUTPUT INSERTED.id VALUES (@title, @position, @level, @technologies, @description, @missions,
              @responsibilities, @required_skills_json, @desired_profile, @recommended_questions_json, @status, @created_by)`);

    const offerId = result.recordset[0].id;
    const offerRow = { id: offerId, title, position, level, technologies };

    const pipeline = await generateRecruitmentPipeline(offerRow);
    await pool.request()
      .input('job_offer_id', sql.Int, offerId)
      .input('steps_json', sql.NVarChar(sql.MAX), JSON.stringify(pipeline.steps || []))
      .query(`INSERT INTO RecruitmentPipelines (job_offer_id, steps_json)
              VALUES (@job_offer_id, @steps_json)`);

    res.status(201).json({ id: offerId, pipeline: pipeline.steps });
  } catch (err) {
    res.status(500).json({ message: 'Erreur création offre', error: err.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const {
      title, position, level, technologies, description, missions,
      responsibilities, required_skills, desired_profile, recommended_questions, status,
    } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('position', sql.NVarChar, position)
      .input('level', sql.NVarChar, level)
      .input('technologies', sql.NVarChar(sql.MAX), toText(technologies))
      .input('description', sql.NVarChar(sql.MAX), toText(description))
      .input('missions', sql.NVarChar(sql.MAX), toText(missions))
      .input('responsibilities', sql.NVarChar(sql.MAX), toText(responsibilities))
      .input('required_skills_json', sql.NVarChar(sql.MAX), JSON.stringify(required_skills || []))
      .input('desired_profile', sql.NVarChar(sql.MAX), toText(desired_profile))
      .input('recommended_questions_json', sql.NVarChar(sql.MAX), JSON.stringify(recommended_questions || []))
      .input('status', sql.NVarChar, status)
      .input('updated_at', sql.DateTime, new Date())
      .query(`UPDATE JobOffers SET title=@title, position=@position, level=@level, technologies=@technologies,
              description=@description, missions=@missions, responsibilities=@responsibilities,
              required_skills_json=@required_skills_json, desired_profile=@desired_profile,
              recommended_questions_json=@recommended_questions_json, status=@status, updated_at=@updated_at
              WHERE id=@id`);

    res.json({ message: 'Offre mise à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updatePipeline = async (req, res) => {
  try {
    const { steps } = req.body;
    if (!Array.isArray(steps)) {
      return res.status(400).json({ message: 'steps doit être un tableau' });
    }

    const pool = await getPool();
    const existing = await pool.request()
      .input('job_offer_id', sql.Int, req.params.id)
      .query('SELECT id FROM RecruitmentPipelines WHERE job_offer_id=@job_offer_id');

    if (existing.recordset[0]) {
      await pool.request()
        .input('job_offer_id', sql.Int, req.params.id)
        .input('steps_json', sql.NVarChar(sql.MAX), JSON.stringify(steps))
        .input('updated_at', sql.DateTime, new Date())
        .query(`UPDATE RecruitmentPipelines SET steps_json=@steps_json, updated_at=@updated_at
                WHERE job_offer_id=@job_offer_id`);
    } else {
      await pool.request()
        .input('job_offer_id', sql.Int, req.params.id)
        .input('steps_json', sql.NVarChar(sql.MAX), JSON.stringify(steps))
        .query(`INSERT INTO RecruitmentPipelines (job_offer_id, steps_json)
                VALUES (@job_offer_id, @steps_json)`);
    }

    res.json({ message: 'Pipeline mis à jour', steps });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.regeneratePipeline = async (req, res) => {
  try {
    const pool = await getPool();
    const offerResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM JobOffers WHERE id=@id');
    const offer = offerResult.recordset[0];
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });

    const pipeline = await generateRecruitmentPipeline(offer);
    const stepsJson = JSON.stringify(pipeline.steps || []);

    const existing = await pool.request()
      .input('job_offer_id', sql.Int, offer.id)
      .query('SELECT id FROM RecruitmentPipelines WHERE job_offer_id=@job_offer_id');

    if (existing.recordset[0]) {
      await pool.request()
        .input('job_offer_id', sql.Int, offer.id)
        .input('steps_json', sql.NVarChar(sql.MAX), stepsJson)
        .input('updated_at', sql.DateTime, new Date())
        .query(`UPDATE RecruitmentPipelines SET steps_json=@steps_json, updated_at=@updated_at
                WHERE job_offer_id=@job_offer_id`);
    } else {
      await pool.request()
        .input('job_offer_id', sql.Int, offer.id)
        .input('steps_json', sql.NVarChar(sql.MAX), stepsJson)
        .query(`INSERT INTO RecruitmentPipelines (job_offer_id, steps_json) VALUES (@job_offer_id, @steps_json)`);
    }

    res.json({ steps: pipeline.steps });
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération pipeline', error: err.message });
  }
};