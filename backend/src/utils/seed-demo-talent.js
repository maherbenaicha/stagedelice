/**
 * seed-demo-talent.js
 * -----------------------------------------------------------------------
 * Remplit le module "Talent / Recrutement" de StageDélice avec des
 * données cohérentes :
 *   - 4 offres d'emploi (JobOffers) + pipeline de recrutement (étapes)
 *   - 12 candidats (Candidates) avec CV + extraction IA simulée (CVs,
 *     CandidateCVExtracts)
 *   - Candidatures (CandidateApplications) reliant candidats <-> offres,
 *     avec résumé IA (forces/faiblesses/recommandation)
 *   - Scores de compatibilité (CandidateCompatibilityScores)
 *   - Modèles d'emails par défaut (EmailTemplates) + quelques emails
 *     déjà générés (EmailLogs)
 *
 * Complémentaire à seed-demo-full.js (qui couvre Tests / Questions /
 * CandidateSessions). Idempotent par titre d'offre : si une offre du
 * même titre existe déjà, elle n'est pas recréée (donc pas de doublons
 * si tu relances par erreur).
 *
 * Usage (depuis backend/) :
 *   node src/utils/seed-demo-talent.js
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

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

// ---------------------------------------------------------------------
// 1) Offres d'emploi
// ---------------------------------------------------------------------
const JOB_OFFERS = [
  {
    title: 'Développeur Full-Stack React / Node.js',
    position: 'Développeur Full-Stack',
    level: 'Confirmé',
    technologies: 'React, Node.js, Express, SQL Server',
    description: "Nous recherchons un développeur full-stack pour renforcer l'équipe produit de StageDélice.",
    missions: "Développer de nouvelles fonctionnalités front et back.\nMaintenir et optimiser l'API existante.\nParticiper aux revues de code.",
    responsibilities: "Concevoir des composants React réutilisables.\nDévelopper des endpoints Express sécurisés.\nÉcrire des tests et documenter le code.",
    required_skills: ['React', 'Node.js', 'Express', 'SQL', 'Git'],
    desired_profile: "Profil autonome, à l'aise en environnement agile, avec un bon sens du détail sur l'UX.",
    recommended_questions: [
      "Comment gérez-vous l'état global dans une application React de taille moyenne ?",
      "Quelle est la différence entre une jointure INNER et LEFT JOIN ?",
      "Comment sécurisez-vous une API Express (auth, validation, CORS) ?",
    ],
    status: 'published',
    pipeline: ['Présélection CV', 'Test technique', 'Entretien RH', 'Entretien technique', 'Décision finale'],
  },
  {
    title: 'Administrateur Systèmes & Réseaux',
    position: 'Administrateur Réseau',
    level: 'Confirmé',
    technologies: 'TCP/IP, Cisco, Windows Server, Linux',
    description: "Recherche d'un administrateur réseau pour la gestion de l'infrastructure IT interne.",
    missions: "Superviser le réseau et les serveurs.\nGérer les incidents et les demandes du support niveau 2.\nMettre en place des politiques de sécurité réseau.",
    responsibilities: "Administrer les équipements réseau (switchs, routeurs, firewalls).\nAssurer la disponibilité des services critiques.\nDocumenter les procédures d'exploitation.",
    required_skills: ['TCP/IP', 'Cisco', 'Windows Server', 'Sécurité réseau'],
    desired_profile: "Personne rigoureuse, réactive en cas d'incident, avec de bonnes bases en sécurité.",
    recommended_questions: [
      "Quelle est la différence entre un switch et un routeur ?",
      "Comment diagnostiquez-vous un problème de latence réseau ?",
      "Qu'est-ce qu'un VLAN et à quoi sert-il ?",
    ],
    status: 'published',
    pipeline: ['Présélection CV', 'Test technique', 'Entretien technique', 'Décision finale'],
  },
  {
    title: 'Consultant ERP / SAP',
    position: 'Consultant ERP',
    level: 'Junior',
    technologies: 'SAP, ERP, Gestion de projet',
    description: "Nous recherchons un consultant ERP junior pour accompagner nos clients dans leurs projets SAP.",
    missions: "Participer au paramétrage des modules SAP.\nAssister les utilisateurs finaux.\nRédiger la documentation fonctionnelle.",
    responsibilities: "Analyser les besoins métier.\nConfigurer les modules FI/MM selon les spécifications.\nFormer les utilisateurs clés.",
    required_skills: ['SAP', 'ERP', 'Gestion de projet', 'Analyse fonctionnelle'],
    desired_profile: "Bon relationnel, capacité d'analyse, appétence pour les processus métier.",
    recommended_questions: [
      "Que signifie l'acronyme ERP et quels en sont les bénéfices ?",
      "Quel module SAP gère la comptabilité financière ?",
      "Comment aborderiez-vous le recueil de besoins auprès d'un client ?",
    ],
    status: 'draft',
    pipeline: ['Présélection CV', 'Entretien RH', 'Étude de cas', 'Décision finale'],
  },
  {
    title: 'Ingénieur DevOps',
    position: 'Ingénieur DevOps',
    level: 'Confirmé',
    technologies: 'Docker, Kubernetes, CI/CD, Jenkins',
    description: "Rejoignez notre équipe pour industrialiser nos pipelines de déploiement.",
    missions: "Concevoir et maintenir les pipelines CI/CD.\nConteneuriser les applications existantes.\nAssurer le monitoring de la production.",
    responsibilities: "Mettre en place des pipelines Jenkins/GitHub Actions.\nGérer des clusters Kubernetes.\nAutomatiser les déploiements et les rollbacks.",
    required_skills: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Scripting'],
    desired_profile: "Profil pragmatique, orienté automatisation, à l'aise avec les environnements cloud.",
    recommended_questions: [
      "Quelle est la différence entre un conteneur et une machine virtuelle ?",
      "Comment fonctionne un déploiement Blue-Green ?",
      "Quel est le rôle d'un orchestrateur comme Kubernetes ?",
    ],
    status: 'published',
    pipeline: ['Présélection CV', 'Test technique', 'Entretien technique', 'Entretien RH', 'Décision finale'],
  },
];

// ---------------------------------------------------------------------
// 2) Candidats + CV (données déjà "extraites", façon IA)
// ---------------------------------------------------------------------
const CANDIDATES = [
  {
    full_name: 'Yassine Chaouch', email: 'yassine.chaouch@example.com', phone: '+216 20 456 789',
    years_of_experience: 4, technical_skills: ['React', 'Node.js', 'Express', 'SQL Server', 'Git'],
    education: [{ degree: 'Ingénieur en informatique', school: 'ENSI', year: '2021' }],
    experiences: [{ title: 'Développeur Full-Stack', company: 'TechNova', duration: '2021-2025', description: 'Développement front/back sur des applications SaaS.' }],
    languages: [{ language: 'Français', level: 'Courant' }, { language: 'Anglais', level: 'Professionnel' }],
    certifications: [], technologies: ['React', 'Node.js', 'Docker'],
  },
  {
    full_name: 'Sirine Ayadi', email: 'sirine.ayadi@example.com', phone: '+216 22 567 890',
    years_of_experience: 2, technical_skills: ['React', 'JavaScript', 'CSS', 'Git'],
    education: [{ degree: 'Licence en informatique', school: 'FST', year: '2023' }],
    experiences: [{ title: 'Développeuse Front-End', company: 'WebCraft', duration: '2023-2025', description: 'Intégration et développement de composants React.' }],
    languages: [{ language: 'Français', level: 'Natif' }, { language: 'Anglais', level: 'Intermédiaire' }],
    certifications: [], technologies: ['React', 'Tailwind'],
  },
  {
    full_name: 'Mokhtar Jaziri', email: 'mokhtar.jaziri@example.com', phone: '+216 24 678 901',
    years_of_experience: 6, technical_skills: ['Node.js', 'Express', 'SQL Server', 'Docker', 'AWS'],
    education: [{ degree: "Master en génie logiciel", school: 'INSAT', year: '2019' }],
    experiences: [{ title: 'Lead Développeur Backend', company: 'DataSys', duration: '2019-2025', description: "Architecture d'API et supervision d'équipe." }],
    languages: [{ language: 'Français', level: 'Courant' }, { language: 'Anglais', level: 'Courant' }],
    certifications: ['AWS Certified Developer'], technologies: ['Node.js', 'AWS', 'Docker'],
  },
  {
    full_name: 'Rym Belkahla', email: 'rym.belkahla@example.com', phone: '+216 26 789 012',
    years_of_experience: 5, technical_skills: ['TCP/IP', 'Cisco', 'Windows Server', 'Sécurité réseau'],
    education: [{ degree: "Ingénieur réseaux et télécoms", school: 'Sup\'Com', year: '2020' }],
    experiences: [{ title: 'Administratrice Réseau', company: 'ConnectIT', duration: '2020-2025', description: "Gestion d'infrastructure réseau multi-sites." }],
    languages: [{ language: 'Français', level: 'Natif' }, { language: 'Anglais', level: 'Professionnel' }],
    certifications: ['CCNA'], technologies: ['Cisco', 'Fortinet'],
  },
  {
    full_name: 'Hamza Trabelsi', email: 'hamza.trabelsi@example.com', phone: '+216 27 890 123',
    years_of_experience: 1, technical_skills: ['Windows Server', 'Réseau', 'Support IT'],
    education: [{ degree: 'BTS Réseaux Informatiques', school: 'ISET', year: '2024' }],
    experiences: [{ title: 'Technicien support', company: 'HelpDesk Pro', duration: '2024-2025', description: 'Support utilisateurs et maintenance parc informatique.' }],
    languages: [{ language: 'Français', level: 'Natif' }],
    certifications: [], technologies: ['Windows Server'],
  },
  {
    full_name: 'Nadia Selmi', email: 'nadia.selmi@example.com', phone: '+216 29 901 234',
    years_of_experience: 3, technical_skills: ['SAP', 'ERP', 'Analyse fonctionnelle'],
    education: [{ degree: 'Master en gestion des systèmes d\'information', school: 'IHEC', year: '2022' }],
    experiences: [{ title: 'Consultante ERP junior', company: 'SAP Partners Tunisie', duration: '2022-2025', description: "Paramétrage de modules FI/MM et accompagnement utilisateurs." }],
    languages: [{ language: 'Français', level: 'Courant' }, { language: 'Anglais', level: 'Intermédiaire' }],
    certifications: ['SAP FI Fundamentals'], technologies: ['SAP FI', 'SAP MM'],
  },
  {
    full_name: 'Oussama Ferchichi', email: 'oussama.ferchichi@example.com', phone: '+216 21 012 345',
    years_of_experience: 0, technical_skills: ['ERP', 'Gestion de projet'],
    education: [{ degree: "Master en management des systèmes d'information", school: 'ESSEC Tunis', year: '2025' }],
    experiences: [{ title: 'Stage assistant chef de projet', company: 'ConsultCorp', duration: '2024-2024', description: 'Support à la gestion de projets ERP.' }],
    languages: [{ language: 'Français', level: 'Natif' }, { language: 'Anglais', level: 'Intermédiaire' }],
    certifications: [], technologies: [],
  },
  {
    full_name: 'Aymen Sassi', email: 'aymen.sassi@example.com', phone: '+216 23 123 456',
    years_of_experience: 4, technical_skills: ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Linux'],
    education: [{ degree: 'Ingénieur en informatique', school: 'ENIT', year: '2021' }],
    experiences: [{ title: 'Ingénieur DevOps', company: 'CloudNext', duration: '2021-2025', description: "Mise en place de pipelines CI/CD et gestion de clusters Kubernetes." }],
    languages: [{ language: 'Français', level: 'Courant' }, { language: 'Anglais', level: 'Courant' }],
    certifications: ['Certified Kubernetes Administrator'], technologies: ['Docker', 'Kubernetes', 'AWS'],
  },
  {
    full_name: 'Ines Charfi', email: 'ines.charfi@example.com', phone: '+216 25 234 567',
    years_of_experience: 2, technical_skills: ['Docker', 'Linux', 'Scripting', 'Git'],
    education: [{ degree: 'Licence en informatique', school: 'FSB', year: '2023' }],
    experiences: [{ title: 'Technicienne DevOps', company: 'InfraWorks', duration: '2023-2025', description: 'Automatisation de scripts de déploiement.' }],
    languages: [{ language: 'Français', level: 'Natif' }],
    certifications: [], technologies: ['Docker'],
  },
  {
    full_name: 'Firas Bouassida', email: 'firas.bouassida@example.com', phone: '+216 28 345 678',
    years_of_experience: 7, technical_skills: ['React', 'Node.js', 'Kubernetes', 'SQL', 'AWS'],
    education: [{ degree: "Master en génie logiciel", school: 'ENSI', year: '2018' }],
    experiences: [{ title: 'Architecte logiciel', company: 'GlobalSoft', duration: '2018-2025', description: "Conception d'architectures full-stack scalables." }],
    languages: [{ language: 'Français', level: 'Courant' }, { language: 'Anglais', level: 'Courant' }],
    certifications: ['AWS Solutions Architect'], technologies: ['React', 'Node.js', 'AWS', 'Kubernetes'],
  },
  {
    full_name: 'Meriem Dridi', email: 'meriem.dridi@example.com', phone: '+216 20 456 123',
    years_of_experience: 1, technical_skills: ['React', 'JavaScript', 'HTML', 'CSS'],
    education: [{ degree: 'Licence appliquée en informatique', school: 'ISI', year: '2024' }],
    experiences: [{ title: 'Développeuse front-end junior', company: 'Freelance', duration: '2024-2025', description: 'Réalisation de sites vitrines et petites applications React.' }],
    languages: [{ language: 'Français', level: 'Natif' }, { language: 'Anglais', level: 'Débutant' }],
    certifications: [], technologies: ['React'],
  },
  {
    full_name: 'Skander Halioui', email: 'skander.halioui@example.com', phone: '+216 22 567 234',
    years_of_experience: 3, technical_skills: ['Cisco', 'TCP/IP', 'Firewall', 'Windows Server'],
    education: [{ degree: 'Ingénieur réseaux', school: 'ISET Rades', year: '2022' }],
    experiences: [{ title: 'Ingénieur réseau', company: 'NetSecure', duration: '2022-2025', description: 'Déploiement et sécurisation de réseaux d\'entreprise.' }],
    languages: [{ language: 'Français', level: 'Courant' }],
    certifications: ['CCNP'], technologies: ['Cisco', 'Palo Alto'],
  },
];

// application_index -> which JOB_OFFERS index (0..3) each candidate applies to,
// plus the application status and a rough performance level used to derive scores.
const APPLICATIONS = [
  { candidate: 0, offer: 0, status: 'shortlisted', level: 'fort' },
  { candidate: 1, offer: 0, status: 'reviewed', level: 'moyen' },
  { candidate: 2, offer: 0, status: 'hired', level: 'fort' },
  { candidate: 9, offer: 0, status: 'new', level: 'faible' },
  { candidate: 3, offer: 1, status: 'shortlisted', level: 'fort' },
  { candidate: 4, offer: 1, status: 'rejected', level: 'faible' },
  { candidate: 10, offer: 1, status: 'reviewed', level: 'moyen' },
  { candidate: 5, offer: 2, status: 'shortlisted', level: 'fort' },
  { candidate: 6, offer: 2, status: 'new', level: 'faible' },
  { candidate: 7, offer: 3, status: 'hired', level: 'fort' },
  { candidate: 8, offer: 3, status: 'reviewed', level: 'moyen' },
  { candidate: 9, offer: 3, status: 'rejected', level: 'faible' },
];

const LEVEL_SCORES = {
  fort: () => ({ global: randInt(80, 96), technical: randInt(80, 98), experience: randInt(75, 95), education: randInt(75, 95), certifications: randInt(60, 90), languages: randInt(70, 95) }),
  moyen: () => ({ global: randInt(55, 72), technical: randInt(50, 72), experience: randInt(45, 70), education: randInt(60, 80), certifications: randInt(30, 60), languages: randInt(60, 80) }),
  faible: () => ({ global: randInt(25, 45), technical: randInt(20, 45), experience: randInt(15, 40), education: randInt(40, 65), certifications: randInt(0, 30), languages: randInt(40, 65) }),
};

const AI_SUMMARY = {
  fort: (name, offer) => ({
    summary: `${name} présente un profil solide, avec une expérience directement alignée sur les besoins du poste "${offer.position}".`,
    strengths: ['Bonne maîtrise des technologies clés du poste', 'Expérience professionnelle pertinente', 'Autonomie démontrée sur des projets similaires'],
    weaknesses: ['Pas de faiblesse majeure identifiée à ce stade'],
    recommendation: 'À convoquer en priorité pour un entretien technique.',
  }),
  moyen: (name, offer) => ({
    summary: `${name} a un profil correct pour le poste "${offer.position}", avec certaines compétences à confirmer en entretien.`,
    strengths: ['Bonne base théorique', 'Motivation apparente pour le poste'],
    weaknesses: ['Expérience encore limitée sur certaines technologies clés', 'Peu de références sur des projets à grande échelle'],
    recommendation: 'Entretien recommandé pour évaluer plus en détail les compétences pratiques.',
  }),
  faible: (name, offer) => ({
    summary: `${name} ne correspond que partiellement aux exigences du poste "${offer.position}".`,
    strengths: ['Bonne volonté et profil junior à potentiel'],
    weaknesses: ['Compétences techniques clés manquantes', 'Expérience insuffisante par rapport au niveau demandé'],
    recommendation: "Profil à conserver en vivier pour un poste plus junior, mais non prioritaire ici.",
  }),
};

const DEFAULT_EMAIL_TEMPLATES = {
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

async function seedJobOffers(pool, adminId) {
  const created = [];
  for (const offer of JOB_OFFERS) {
    const existing = await pool.request()
      .input('title', sql.NVarChar, offer.title)
      .query('SELECT id FROM JobOffers WHERE title=@title');

    if (existing.recordset.length > 0) {
      console.log(`↷ Offre déjà présente : "${offer.title}" — ignorée.`);
      created.push({ id: existing.recordset[0].id, def: offer, isNew: false });
      continue;
    }

    const result = await pool.request()
      .input('title', sql.NVarChar, offer.title)
      .input('position', sql.NVarChar, offer.position)
      .input('level', sql.NVarChar, offer.level)
      .input('technologies', sql.NVarChar(sql.MAX), offer.technologies)
      .input('description', sql.NVarChar(sql.MAX), offer.description)
      .input('missions', sql.NVarChar(sql.MAX), offer.missions)
      .input('responsibilities', sql.NVarChar(sql.MAX), offer.responsibilities)
      .input('required_skills_json', sql.NVarChar(sql.MAX), JSON.stringify(offer.required_skills))
      .input('desired_profile', sql.NVarChar(sql.MAX), offer.desired_profile)
      .input('recommended_questions_json', sql.NVarChar(sql.MAX), JSON.stringify(offer.recommended_questions))
      .input('status', sql.NVarChar, offer.status)
      .input('created_by', sql.Int, adminId)
      .query(`INSERT INTO JobOffers
                (title, position, level, technologies, description, missions, responsibilities,
                 required_skills_json, desired_profile, recommended_questions_json, status, created_by)
              OUTPUT INSERTED.id VALUES
                (@title, @position, @level, @technologies, @description, @missions, @responsibilities,
                 @required_skills_json, @desired_profile, @recommended_questions_json, @status, @created_by)`);
    const offerId = result.recordset[0].id;

    await pool.request()
      .input('job_offer_id', sql.Int, offerId)
      .input('steps_json', sql.NVarChar(sql.MAX), JSON.stringify(offer.pipeline.map(title => ({ title, description: '' }))))
      .query(`INSERT INTO RecruitmentPipelines (job_offer_id, steps_json) VALUES (@job_offer_id, @steps_json)`);

    console.log(`✅ Offre créée : "${offer.title}" (${offer.status})`);
    created.push({ id: offerId, def: offer, isNew: true });
  }
  return created;
}

async function seedCandidatesAndCVs(pool, rhId) {
  const created = [];
  for (const c of CANDIDATES) {
    const existing = await pool.request()
      .input('email', sql.NVarChar, c.email)
      .query('SELECT id FROM Candidates WHERE email=@email');

    let candidateId;
    if (existing.recordset.length > 0) {
      candidateId = existing.recordset[0].id;
      console.log(`↷ Candidat déjà présent : ${c.full_name} — CV ignoré.`);
      created.push({ id: candidateId, def: c, isNew: false });
      continue;
    }

    const candResult = await pool.request()
      .input('full_name', sql.NVarChar, c.full_name)
      .input('email', sql.NVarChar, c.email)
      .input('phone', sql.NVarChar, c.phone)
      .query(`INSERT INTO Candidates (full_name, email, phone) OUTPUT INSERTED.id VALUES (@full_name, @email, @phone)`);
    candidateId = candResult.recordset[0].id;

    const fileName = `CV_${c.full_name.replace(/\s+/g, '_')}.pdf`;
    const cvResult = await pool.request()
      .input('candidate_id', sql.Int, candidateId)
      .input('file_name', sql.NVarChar, fileName)
      .input('mime_type', sql.NVarChar, 'application/pdf')
      .input('file_path', sql.NVarChar, `/uploads/cvs/${fileName}`)
      .input('text_content', sql.NVarChar(sql.MAX), `CV de ${c.full_name} — ${c.years_of_experience} an(s) d'expérience. Compétences: ${c.technical_skills.join(', ')}.`)
      .input('uploaded_by', sql.Int, rhId)
      .query(`INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
              OUTPUT INSERTED.id VALUES (@candidate_id, @file_name, @mime_type, @file_path, @text_content, @uploaded_by)`);
    const cvId = cvResult.recordset[0].id;

    const extracted = {
      full_name: c.full_name, email: c.email, phone: c.phone,
      education: c.education, diplomas: c.education.map(e => e.degree),
      experiences: c.experiences, years_of_experience: c.years_of_experience,
      technical_skills: c.technical_skills, languages: c.languages,
      certifications: c.certifications, technologies: c.technologies,
    };
    await pool.request()
      .input('cv_id', sql.Int, cvId)
      .input('extracted_json', sql.NVarChar(sql.MAX), JSON.stringify(extracted))
      .query(`INSERT INTO CandidateCVExtracts (cv_id, extracted_json) VALUES (@cv_id, @extracted_json)`);

    console.log(`✅ Candidat créé : ${c.full_name} (CV + extraction IA simulée)`);
    created.push({ id: candidateId, cvId, def: c, isNew: true });
  }
  return created;
}

async function seedApplications(pool, offers, candidates) {
  for (const app of APPLICATIONS) {
    const offer = offers[app.offer];
    const candidate = candidates[app.candidate];
    const existing = await pool.request()
      .input('job_offer_id', sql.Int, offer.id)
      .input('candidate_id', sql.Int, candidate.id)
      .query('SELECT id FROM CandidateApplications WHERE job_offer_id=@job_offer_id AND candidate_id=@candidate_id');
    if (existing.recordset.length > 0) {
      console.log(`↷ Candidature déjà présente : ${candidate.def.full_name} -> "${offer.def.title}" — ignorée.`);
      continue;
    }

    const cvId = candidate.cvId || (await pool.request()
      .input('candidate_id', sql.Int, candidate.id)
      .query('SELECT TOP 1 id FROM CandidateCVs WHERE candidate_id=@candidate_id ORDER BY id')).recordset[0]?.id;
    if (!cvId) { console.log(`⚠️  Pas de CV trouvé pour ${candidate.def.full_name}, candidature ignorée.`); continue; }

    const ai = AI_SUMMARY[app.level](candidate.def.full_name, offer.def);

    const appResult = await pool.request()
      .input('job_offer_id', sql.Int, offer.id)
      .input('candidate_id', sql.Int, candidate.id)
      .input('cv_id', sql.Int, cvId)
      .input('status', sql.NVarChar, app.status)
      .input('ai_profile_summary', sql.NVarChar(sql.MAX), ai.summary)
      .input('ai_strengths_json', sql.NVarChar(sql.MAX), JSON.stringify(ai.strengths))
      .input('ai_weaknesses_json', sql.NVarChar(sql.MAX), JSON.stringify(ai.weaknesses))
      .input('ai_recommendation', sql.NVarChar, ai.recommendation)
      .query(`INSERT INTO CandidateApplications
                (job_offer_id, candidate_id, cv_id, status, ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
              OUTPUT INSERTED.id VALUES
                (@job_offer_id, @candidate_id, @cv_id, @status, @ai_profile_summary, @ai_strengths_json, @ai_weaknesses_json, @ai_recommendation)`);
    const applicationId = appResult.recordset[0].id;

    const scores = LEVEL_SCORES[app.level]();
    const strengths = candidate.def.technical_skills.slice(0, 3);
    const missing = offer.def.required_skills.filter(s => !candidate.def.technical_skills.includes(s));

    await pool.request()
      .input('application_id', sql.Int, applicationId)
      .input('score_global', sql.Int, scores.global)
      .input('score_technical', sql.Int, scores.technical)
      .input('score_experience', sql.Int, scores.experience)
      .input('score_education', sql.Int, scores.education)
      .input('score_certifications', sql.Int, scores.certifications)
      .input('score_languages', sql.Int, scores.languages)
      .input('strengths_json', sql.NVarChar(sql.MAX), JSON.stringify(strengths))
      .input('missing_skills_json', sql.NVarChar(sql.MAX), JSON.stringify(missing))
      .input('explanation', sql.NVarChar(sql.MAX), `Score calculé à partir de l'adéquation entre les compétences du CV et les exigences du poste "${offer.def.position}".`)
      .query(`INSERT INTO CandidateCompatibilityScores
                (application_id, score_global, score_technical, score_experience, score_education,
                 score_certifications, score_languages, strengths_json, missing_skills_json, explanation)
              VALUES
                (@application_id, @score_global, @score_technical, @score_experience, @score_education,
                 @score_certifications, @score_languages, @strengths_json, @missing_skills_json, @explanation)`);

    console.log(`✅ Candidature : ${candidate.def.full_name} -> "${offer.def.title}" (${app.status}, score ${scores.global}%)`);

    // Log d'email pour les candidatures shortlisted/hired/rejected (workflow réaliste)
    const templateKey = app.status === 'hired' ? 'acceptation' : app.status === 'rejected' ? 'refus' : app.status === 'shortlisted' ? 'invitation_entretien' : null;
    if (templateKey) {
      const tpl = DEFAULT_EMAIL_TEMPLATES[templateKey];
      const subject = tpl.subject.replace('{{job_title}}', offer.def.position);
      const body = tpl.body.replace(/{{candidate_name}}/g, candidate.def.full_name).replace(/{{job_title}}/g, offer.def.position);
      await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('template_key', sql.NVarChar, templateKey)
        .input('to_email', sql.NVarChar, candidate.def.email)
        .input('subject', sql.NVarChar, subject)
        .input('body', sql.NVarChar(sql.MAX), body)
        .input('status', sql.NVarChar, 'draft')
        .query(`INSERT INTO EmailLogs (application_id, template_key, to_email, subject, body, status)
                VALUES (@application_id, @template_key, @to_email, @subject, @body, @status)`);
    }
  }
}

async function seedEmailTemplates(pool, adminId) {
  for (const [key, tpl] of Object.entries(DEFAULT_EMAIL_TEMPLATES)) {
    const existing = await pool.request()
      .input('template_key', sql.NVarChar, key)
      .query('SELECT id FROM EmailTemplates WHERE template_key=@template_key');
    if (existing.recordset.length > 0) continue;

    await pool.request()
      .input('template_key', sql.NVarChar, key)
      .input('subject_template', sql.NVarChar, tpl.subject)
      .input('body_template', sql.NVarChar(sql.MAX), tpl.body)
      .input('created_by', sql.Int, adminId)
      .query(`INSERT INTO EmailTemplates (template_key, subject_template, body_template, created_by)
              VALUES (@template_key, @subject_template, @body_template, @created_by)`);
  }
  console.log('✅ Modèles d\'emails par défaut vérifiés/insérés.');
}

async function main() {
  console.log(`Connexion à SQL Server (${config.server})...`);
  const pool = await sql.connect(config);

  try {
    const usersResult = await pool.request().query("SELECT id, role FROM Users WHERE email IN ('admin@stagedelice.com','rh@stagedelice.com')");
    const adminId = usersResult.recordset.find(u => u.role === 'admin')?.id;
    const rhId = usersResult.recordset.find(u => u.role === 'rh')?.id || adminId;
    if (!adminId) throw new Error("Utilisateur admin@stagedelice.com introuvable — lance d'abord 'npm run seed'.");

    const offers = await seedJobOffers(pool, adminId);
    const candidates = await seedCandidatesAndCVs(pool, rhId);
    await seedApplications(pool, offers, candidates);
    await seedEmailTemplates(pool, adminId);

    console.log('\n✅ Données de démo "Talent" insérées avec succès.');
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error('❌ Échec du seed talent :', err.message);
  process.exit(1);
});