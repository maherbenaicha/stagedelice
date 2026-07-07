-- =====================================================
-- StageDélice — Données de test pour le module Talent AI
-- Remplit : 1 offre publiée + pipeline + 5 candidats scorés
-- Prérequis : avoir déjà exécuté init-db.sql et avoir au
-- moins un utilisateur (admin) dans la table Users.
-- Usage : sqlcmd -S DESKTOP-H7B9HA5\SQLEXPRESS -U sa -P maher -d TechTestDB -i seed-talent-data.sql
-- =====================================================

USE TechTestDB;
GO

DECLARE @adminId INT = (SELECT TOP 1 id FROM Users ORDER BY id);

-- 1) Offre d'emploi
INSERT INTO JobOffers (title, position, level, technologies, description, missions, responsibilities,
  required_skills_json, desired_profile, recommended_questions_json, status, created_by)
VALUES (
  N'Développeur Backend Java Confirmé',
  N'Développeur Backend',
  N'Intermédiaire',
  N'Java, Spring Boot, SQL Server',
  N'Nous recherchons un développeur backend passionné pour rejoindre notre équipe et concevoir des services robustes.',
  N'Développer et maintenir des API REST' + CHAR(13) + N'Concevoir des schémas de base de données' + CHAR(13) + N'Participer aux revues de code',
  N'Écrire du code testé et documenté' + CHAR(13) + N'Collaborer avec les équipes frontend et DevOps',
  N'["Java", "Spring Boot", "SQL", "REST API", "Git"]',
  N'3 ans d''expérience minimum en développement backend Java, bonne connaissance des bases de données relationnelles.',
  N'["Expliquez le fonctionnement de l''injection de dépendances dans Spring", "Comment optimiseriez-vous une requête SQL lente ?"]',
  N'published',
  @adminId
);
DECLARE @offerId INT = SCOPE_IDENTITY();

-- 2) Pipeline de recrutement
INSERT INTO RecruitmentPipelines (job_offer_id, steps_json)
VALUES (@offerId, N'[
  {"order":1,"title":"Analyse CV IA","description":"Analyse automatique des candidatures"},
  {"order":2,"title":"Test technique","description":"QCM Java / SQL sur la plateforme"},
  {"order":3,"title":"Entretien technique","description":"Entretien avec l''équipe technique"},
  {"order":4,"title":"Entretien RH","description":"Entretien culture et motivation"},
  {"order":5,"title":"Décision finale","description":"Validation et proposition"}
]');

-- 3) Candidats + CV factices + extraction + application + score
-- Candidat 1 — Excellent profil
INSERT INTO Candidates (full_name, email, phone) VALUES (N'Amine Ben Salah', N'amine.bensalah@example.com', N'+216 20 123 456');
DECLARE @c1 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
VALUES (@c1, N'amine_bensalah_cv.pdf', N'application/pdf', N'uploads/cvs/seed_amine.pdf', N'CV de test généré pour seed', @adminId);
DECLARE @cv1 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVExtracts (cv_id, extracted_json)
VALUES (@cv1, N'{"full_name":"Amine Ben Salah","email":"amine.bensalah@example.com","years_of_experience":5,"technical_skills":["Java","Spring Boot","SQL","Docker"],"education":"Master Informatique"}');
INSERT INTO CandidateApplications (job_offer_id, candidate_id, cv_id, status, ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
VALUES (@offerId, @c1, @cv1, N'reviewed', N'Profil senior avec 5 ans d''expérience solide en Java/Spring Boot, bon maîtrise des bases de données.', N'["Expérience Spring Boot confirmée","Bonne maîtrise SQL","Autonomie"]', N'["Peu d''expérience DevOps"]', N'Fortement recommandé pour un entretien technique.');
DECLARE @app1 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCompatibilityScores (application_id, score_global, score_technical, score_experience, score_education, score_certifications, score_languages, strengths_json, missing_skills_json, explanation)
VALUES (@app1, 92, 95, 90, 85, 70, 88, N'["Java","Spring Boot","SQL"]', N'["Kubernetes"]', N'Excellent match avec les compétences requises.');

-- Candidat 2 — Bon profil
INSERT INTO Candidates (full_name, email, phone) VALUES (N'Sarra Trabelsi', N'sarra.trabelsi@example.com', N'+216 22 234 567');
DECLARE @c2 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
VALUES (@c2, N'sarra_trabelsi_cv.pdf', N'application/pdf', N'uploads/cvs/seed_sarra.pdf', N'CV de test généré pour seed', @adminId);
DECLARE @cv2 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVExtracts (cv_id, extracted_json)
VALUES (@cv2, N'{"full_name":"Sarra Trabelsi","email":"sarra.trabelsi@example.com","years_of_experience":3,"technical_skills":["Java","SQL","Git"],"education":"Licence Informatique"}');
INSERT INTO CandidateApplications (job_offer_id, candidate_id, cv_id, status, ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
VALUES (@offerId, @c2, @cv2, N'new', N'Profil intermédiaire correspondant globalement au poste, expérience correcte en Java.', N'["Bonne base Java","Motivée"]', N'["Pas d''expérience Spring Boot avancée"]', N'À convoquer pour un test technique.');
DECLARE @app2 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCompatibilityScores (application_id, score_global, score_technical, score_experience, score_education, score_certifications, score_languages, strengths_json, missing_skills_json, explanation)
VALUES (@app2, 74, 70, 65, 80, 50, 75, N'["Java","SQL"]', N'["Spring Boot","Docker"]', N'Bon potentiel mais manque d''expérience sur le framework principal.');

-- Candidat 3 — Profil moyen
INSERT INTO Candidates (full_name, email, phone) VALUES (N'Youssef Gharbi', N'youssef.gharbi@example.com', N'+216 24 345 678');
DECLARE @c3 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
VALUES (@c3, N'youssef_gharbi_cv.pdf', N'application/pdf', N'uploads/cvs/seed_youssef.pdf', N'CV de test généré pour seed', @adminId);
DECLARE @cv3 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVExtracts (cv_id, extracted_json)
VALUES (@cv3, N'{"full_name":"Youssef Gharbi","email":"youssef.gharbi@example.com","years_of_experience":1,"technical_skills":["Java","HTML"],"education":"Licence Informatique"}');
INSERT INTO CandidateApplications (job_offer_id, candidate_id, cv_id, status, ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
VALUES (@offerId, @c3, @cv3, N'new', N'Profil junior, encore peu d''expérience professionnelle.', N'["Motivation","Bases Java"]', N'["Manque d''expérience","Pas de SQL avancé"]', N'Profil junior, à considérer pour un poste d''entrée.');
DECLARE @app3 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCompatibilityScores (application_id, score_global, score_technical, score_experience, score_education, score_certifications, score_languages, strengths_json, missing_skills_json, explanation)
VALUES (@app3, 48, 40, 20, 70, 30, 60, N'["Java"]', N'["Spring Boot","SQL avancé","Docker"]', N'Profil junior ne correspondant pas totalement au niveau demandé.');

-- Candidat 4 — Profil fort mais autre stack
INSERT INTO Candidates (full_name, email, phone) VALUES (N'Nour El Houda Jaziri', N'nour.jaziri@example.com', N'+216 26 456 789');
DECLARE @c4 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
VALUES (@c4, N'nour_jaziri_cv.pdf', N'application/pdf', N'uploads/cvs/seed_nour.pdf', N'CV de test généré pour seed', @adminId);
DECLARE @cv4 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVExtracts (cv_id, extracted_json)
VALUES (@cv4, N'{"full_name":"Nour El Houda Jaziri","email":"nour.jaziri@example.com","years_of_experience":4,"technical_skills":["Node.js","MongoDB","React"],"education":"Ingénieur Informatique"}');
INSERT INTO CandidateApplications (job_offer_id, candidate_id, cv_id, status, ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
VALUES (@offerId, @c4, @cv4, N'rejected', N'Bon profil développeur mais stack technique différente (Node.js plutôt que Java).', N'["Solide en JavaScript","Expérience full-stack"]', N'["Pas d''expérience Java/Spring"]', N'Ne correspond pas à la stack technique recherchée.');
DECLARE @app4 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCompatibilityScores (application_id, score_global, score_technical, score_experience, score_education, score_certifications, score_languages, strengths_json, missing_skills_json, explanation)
VALUES (@app4, 35, 20, 75, 85, 40, 70, N'["Node.js","MongoDB"]', N'["Java","Spring Boot"]', N'Expérience solide mais sur une stack différente de celle recherchée.');

-- Candidat 5 — Profil excellent, à shortlister
INSERT INTO Candidates (full_name, email, phone) VALUES (N'Mehdi Chaabane', N'mehdi.chaabane@example.com', N'+216 28 567 890');
DECLARE @c5 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVs (candidate_id, file_name, mime_type, file_path, text_content, uploaded_by)
VALUES (@c5, N'mehdi_chaabane_cv.pdf', N'application/pdf', N'uploads/cvs/seed_mehdi.pdf', N'CV de test généré pour seed', @adminId);
DECLARE @cv5 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCVExtracts (cv_id, extracted_json)
VALUES (@cv5, N'{"full_name":"Mehdi Chaabane","email":"mehdi.chaabane@example.com","years_of_experience":6,"technical_skills":["Java","Spring Boot","SQL","Docker","Kubernetes"],"education":"Master Génie Logiciel"}');
INSERT INTO CandidateApplications (job_offer_id, candidate_id, cv_id, status, ai_profile_summary, ai_strengths_json, ai_weaknesses_json, ai_recommendation)
VALUES (@offerId, @c5, @cv5, N'shortlisted', N'Profil senior très complet, maîtrise complète de la stack demandée avec expérience DevOps.', N'["Expert Java/Spring Boot","Maîtrise Docker/Kubernetes","Excellente autonomie"]', N'["Prétentions salariales potentiellement élevées"]', N'Profil très fortement recommandé, à convoquer en priorité.');
DECLARE @app5 INT = SCOPE_IDENTITY();
INSERT INTO CandidateCompatibilityScores (application_id, score_global, score_technical, score_experience, score_education, score_certifications, score_languages, strengths_json, missing_skills_json, explanation)
VALUES (@app5, 97, 98, 95, 90, 85, 90, N'["Java","Spring Boot","SQL","Docker","Kubernetes"]', N'[]', N'Correspondance quasi parfaite avec le profil recherché.');

PRINT 'Données de test insérées avec succès : 1 offre + pipeline + 5 candidats scorés.';
GO