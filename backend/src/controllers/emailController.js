const { getPool, sql } = require('../config/database');
const { generatePersonalizedEmail } = require('../services/geminiService');

const DEFAULT_TEMPLATES = {
  invitation_test: {
    subject: 'Invitation au test technique - {{job_title}}',
    body: 'Bonjour {{candidate_name}},\n\nVotre profil correspond à notre recherche de {{job_title}}.\nNous vous invitons à passer notre test technique.\n\nCordialement,\nL\'équipe RH',
  },
  acceptation: {
    subject: 'Félicitations - {{job_title}}',
    body: 'Bonjour {{candidate_name}},\n\nNous avons le plaisir de vous informer que votre candidature pour le poste {{job_title}} a été retenue.\n\nCordialement,\nL\'équipe RH',
  },
  refus: {
    subject: 'Retour sur votre candidature - {{job_title}}',
    body: 'Bonjour {{candidate_name}},\n\nNous vous remercions pour l\'intérêt porté au poste {{job_title}}. Après étude de votre dossier, nous ne pouvons pas donner suite favorablement.\n\nCordialement,\nL\'équipe RH',
  },
  invitation_entretien: {
    subject: 'Invitation entretien - {{job_title}}',
    body: 'Bonjour {{candidate_name}},\n\nNous souhaitons vous rencontrer pour un entretien concernant le poste {{job_title}}.\n\nCordialement,\nL\'équipe RH',
  },
  relance: {
    subject: 'Relance - {{job_title}}',
    body: 'Bonjour {{candidate_name}},\n\nNous revenons vers vous concernant votre candidature pour {{job_title}}.\n\nCordialement,\nL\'équipe RH',
  },
};

exports.getTemplates = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM EmailTemplates ORDER BY template_key');
    if (result.recordset.length === 0) {
      return res.json(Object.entries(DEFAULT_TEMPLATES).map(([key, val]) => ({
        template_key: key,
        subject_template: val.subject,
        body_template: val.body,
        is_default: true,
      })));
    }
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.saveTemplate = async (req, res) => {
  try {
    const { template_key, subject_template, body_template } = req.body;
    if (!template_key || !subject_template || !body_template) {
      return res.status(400).json({ message: 'template_key, subject_template et body_template requis' });
    }

    const pool = await getPool();
    const existing = await pool.request()
      .input('template_key', sql.NVarChar, template_key)
      .query('SELECT id FROM EmailTemplates WHERE template_key=@template_key');

    if (existing.recordset[0]) {
      await pool.request()
        .input('template_key', sql.NVarChar, template_key)
        .input('subject_template', sql.NVarChar, subject_template)
        .input('body_template', sql.NVarChar(sql.MAX), body_template)
        .input('updated_at', sql.DateTime, new Date())
        .query(`UPDATE EmailTemplates SET subject_template=@subject_template, body_template=@body_template,
                updated_at=@updated_at WHERE template_key=@template_key`);
    } else {
      await pool.request()
        .input('template_key', sql.NVarChar, template_key)
        .input('subject_template', sql.NVarChar, subject_template)
        .input('body_template', sql.NVarChar(sql.MAX), body_template)
        .input('created_by', sql.Int, req.user.id)
        .query(`INSERT INTO EmailTemplates (template_key, subject_template, body_template, created_by)
                VALUES (@template_key, @subject_template, @body_template, @created_by)`);
    }

    res.json({ message: 'Template enregistré' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.generateEmail = async (req, res) => {
  try {
    const { application_id, template_type, extra_context } = req.body;
    if (!application_id || !template_type) {
      return res.status(400).json({ message: 'application_id et template_type requis' });
    }

    const pool = await getPool();
    const appResult = await pool.request()
      .input('id', sql.Int, application_id)
      .query(`
        SELECT ca.*, c.full_name, c.email, jo.title AS job_title, jo.position
        FROM CandidateApplications ca
        JOIN Candidates c ON ca.candidate_id = c.id
        JOIN JobOffers jo ON ca.job_offer_id = jo.id
        WHERE ca.id=@id`);

    const app = appResult.recordset[0];
    if (!app) return res.status(404).json({ message: 'Candidature non trouvée' });

    const candidate = { full_name: app.full_name, email: app.email };
    const jobOffer = { title: app.job_title, position: app.position };

    const generated = await generatePersonalizedEmail({
      templateType: template_type,
      candidate,
      jobOffer,
      extraContext: extra_context || '',
    });

    const toEmail = app.email || 'candidat@example.com';

    const logResult = await pool.request()
      .input('application_id', sql.Int, application_id)
      .input('template_key', sql.NVarChar, template_type)
      .input('to_email', sql.NVarChar, toEmail)
      .input('subject', sql.NVarChar, generated.subject)
      .input('body', sql.NVarChar(sql.MAX), generated.body)
      .query(`INSERT INTO EmailLogs (application_id, template_key, to_email, subject, body)
              OUTPUT INSERTED.id VALUES (@application_id, @template_key, @to_email, @subject, @body)`);

    res.json({
      id: logResult.recordset[0].id,
      to_email: toEmail,
      subject: generated.subject,
      body: generated.body,
      status: 'draft',
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération email', error: err.message });
  }
};

exports.getEmailLogs = async (req, res) => {
  try {
    const pool = await getPool();
    let query = 'SELECT * FROM EmailLogs ORDER BY created_at DESC';
    if (req.query.application_id) {
      query = 'SELECT * FROM EmailLogs WHERE application_id=@application_id ORDER BY created_at DESC';
    }
    const request = pool.request();
    if (req.query.application_id) {
      request.input('application_id', sql.Int, parseInt(req.query.application_id, 10));
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
