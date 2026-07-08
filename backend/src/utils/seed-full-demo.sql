-- =====================================================
-- StageDélice — Script AUTONOME de remplissage complet
-- Crée (si absents) : admin/RH + 6 tests + questions + ~23 sessions candidats
-- Peut être exécuté seul dans SSMS, même sur une base TechTestDB vide
-- (à condition que les tables existent déjà, cf. init-db.sql)
-- =====================================================

USE TechTestDB;
GO

-- 1) Utilisateurs par défaut (si absents)
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@stagedelice.com')
BEGIN
    INSERT INTO Users (full_name, email, password_hash, role)
    VALUES (N'Administrateur', 'admin@stagedelice.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
END
GO
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'rh@stagedelice.com')
BEGIN
    INSERT INTO Users (full_name, email, password_hash, role)
    VALUES (N'Responsable RH', 'rh@stagedelice.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'rh');
END
GO

-- 2) Test JavaScript (si absent) — identique à init-db.sql
IF NOT EXISTS (SELECT * FROM Tests WHERE access_code = 'JS2024')
BEGIN
    DECLARE @AdminId0 INT = (SELECT TOP 1 id FROM Users WHERE role='admin' ORDER BY id);
    DECLARE @JSTestId INT;
    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (N'Test JavaScript - Niveau Intermediaire', N'Évaluation des connaissances JavaScript pour développeurs web', 'JavaScript', 30, 60, 'JS2024', @AdminId0);
    SET @JSTestId = SCOPE_IDENTITY();
    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@JSTestId, N'Quelle methode permet d''ajouter un element a la fin d''un tableau ?', N'["push()","pop()","shift()","unshift()"]', 0, 'facile', 1, 1),
    (@JSTestId, N'Que retourne typeof null ?', N'["\"null\"","\"object\"","\"undefined\"","\"number\""]', 1, 'moyen', 2, 2),
    (@JSTestId, N'Quel mot-cle declare une variable dont la reference ne peut pas etre reassignee ?', N'["var","let","const","static"]', 2, 'facile', 1, 3),
    (@JSTestId, N'Quelle methode sert a transformer chaque element d''un tableau ?', N'["forEach()","map()","filter()","reduce()"]', 1, 'moyen', 2, 4),
    (@JSTestId, N'Que fait Promise.all() ?', N'["Resout des la premiere promesse", "Rejette toutes les promesses", "Attend que toutes les promesses soient resolues", "Annule les promesses en attente"]', 2, 'difficile', 3, 5);
END
GO

-- 3) Déclaration de @adminId pour les tests suivants
DECLARE @adminId INT = (SELECT TOP 1 id FROM Users WHERE role='admin' ORDER BY id);
IF @adminId IS NULL SET @adminId = (SELECT TOP 1 id FROM Users ORDER BY id);

-- =====================================================
-- TEST : Test SQL Server - Requêtes et Bases de données
-- =====================================================
IF NOT EXISTS (SELECT * FROM Tests WHERE access_code = 'SQL2024')
BEGIN
    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (N'Test SQL Server - Requêtes et Bases de données', N'Évaluation des compétences en SQL : requêtes, jointures, contraintes et administration de base.', N'SQL', 25, 60, 'SQL2024', @adminId);
    DECLARE @SQL_TestId INT = SCOPE_IDENTITY();

    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@SQL_TestId, N'Quelle commande SQL permet de récupérer des données ?', N'["SELECT", "GET", "FETCH", "EXTRACT"]', 0, 'facile', 1, 1),
    (@SQL_TestId, N'Quelle clause permet de filtrer les résultats d''une requête ?', N'["ORDER BY", "WHERE", "GROUP BY", "HAVING"]', 1, 'facile', 1, 2),
    (@SQL_TestId, N'Quelle jointure retourne uniquement les lignes correspondantes dans les deux tables ?', N'["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"]', 2, 'moyen', 2, 3),
    (@SQL_TestId, N'Quelle clause permet de filtrer les résultats après un GROUP BY ?', N'["WHERE", "HAVING", "ORDER BY", "FILTER"]', 1, 'moyen', 2, 4),
    (@SQL_TestId, N'Quelle instruction supprime une table ainsi que sa structure ?', N'["DELETE", "TRUNCATE", "DROP", "REMOVE"]', 2, 'difficile', 3, 5),
    (@SQL_TestId, N'Quelle contrainte interdit les valeurs NULL dans une colonne ?', N'["UNIQUE", "NOT NULL", "CHECK", "DEFAULT"]', 1, 'moyen', 2, 6);
    DECLARE @SQL_LastQ INT = SCOPE_IDENTITY();
    DECLARE @SQL_Q1 INT = @SQL_LastQ - 5;
    DECLARE @SQL_Q2 INT = @SQL_LastQ - 4;
    DECLARE @SQL_Q3 INT = @SQL_LastQ - 3;
    DECLARE @SQL_Q4 INT = @SQL_LastQ - 2;
    DECLARE @SQL_Q5 INT = @SQL_LastQ - 1;
    DECLARE @SQL_Q6 INT = @SQL_LastQ - 0;
END
GO

-- Sessions candidats — Test SQL Server - Requêtes et Bases de données
BEGIN
    DECLARE @SQL_TestId2 INT = (SELECT id FROM Tests WHERE access_code = 'SQL2024');
    DECLARE @SQL_S_Q1 INT;
    DECLARE @SQL_S_Q2 INT;
    DECLARE @SQL_S_Q3 INT;
    DECLARE @SQL_S_Q4 INT;
    DECLARE @SQL_S_Q5 INT;
    DECLARE @SQL_S_Q6 INT;
    SELECT @SQL_S_Q1 = MIN(id) FROM Questions WHERE test_id = @SQL_TestId2;
    SET @SQL_S_Q2 = @SQL_S_Q1 + 1;
    SET @SQL_S_Q3 = @SQL_S_Q1 + 2;
    SET @SQL_S_Q4 = @SQL_S_Q1 + 3;
    SET @SQL_S_Q5 = @SQL_S_Q1 + 4;
    SET @SQL_S_Q6 = @SQL_S_Q1 + 5;

    -- Candidat : Ahmed Zaidi — score 73% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@SQL_TestId2, N'Ahmed Zaidi', N'ahmed.zaidi@example.com', N'+216 20 111 222', 73, 8, 11, N'réussi', 1180,
        N'[' + N'{"question_id":' + CAST(@SQL_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3},' + N'{"question_id":' + CAST(@SQL_S_Q6 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2}' + N']',
        DATEADD(MINUTE, 25, '2026-06-10 09:00:00'), '2026-06-10 09:00:00', DATEADD(SECOND, 1180, '2026-06-10 09:00:00'));

    -- Candidat : Sana Ferjani — score 36% (échoué)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@SQL_TestId2, N'Sana Ferjani', N'sana.ferjani@example.com', N'+216 22 222 333', 36, 4, 11, N'échoué', 900,
        N'[' + N'{"question_id":' + CAST(@SQL_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q3 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3},' + N'{"question_id":' + CAST(@SQL_S_Q6 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2}' + N']',
        DATEADD(MINUTE, 25, '2026-06-12 14:30:00'), '2026-06-12 14:30:00', DATEADD(SECOND, 900, '2026-06-12 14:30:00'));

    -- Candidat : Karim Bouzid — score 100% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@SQL_TestId2, N'Karim Bouzid', N'karim.bouzid@example.com', N'+216 24 333 444', 100, 11, 11, N'réussi', 1350,
        N'[' + N'{"question_id":' + CAST(@SQL_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3},' + N'{"question_id":' + CAST(@SQL_S_Q6 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2}' + N']',
        DATEADD(MINUTE, 25, '2026-06-15 10:15:00'), '2026-06-15 10:15:00', DATEADD(SECOND, 1350, '2026-06-15 10:15:00'));

    -- Candidat : Ines Mansour — score 64% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@SQL_TestId2, N'Ines Mansour', N'ines.mansour@example.com', N'+216 26 444 555', 64, 7, 11, N'réussi', 1050,
        N'[' + N'{"question_id":' + CAST(@SQL_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":1},' + N'{"question_id":' + CAST(@SQL_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@SQL_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3},' + N'{"question_id":' + CAST(@SQL_S_Q6 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2}' + N']',
        DATEADD(MINUTE, 25, '2026-06-18 11:45:00'), '2026-06-18 11:45:00', DATEADD(SECOND, 1050, '2026-06-18 11:45:00'));

END
GO

-- =====================================================
-- TEST : Test Réseaux - Notions fondamentales
-- =====================================================
IF NOT EXISTS (SELECT * FROM Tests WHERE access_code = 'RES2024')
BEGIN
    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (N'Test Réseaux - Notions fondamentales', N'Évaluation des connaissances de base en réseaux informatiques (protocoles, modèle OSI, ports).', N'Réseau', 20, 60, 'RES2024', @adminId);
    DECLARE @RES_TestId INT = SCOPE_IDENTITY();

    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@RES_TestId, N'Quel protocole permet de résoudre un nom de domaine en adresse IP ?', N'["HTTP", "DNS", "FTP", "SMTP"]', 1, 'facile', 1, 1),
    (@RES_TestId, N'Quelle couche du modèle OSI gère le routage entre réseaux ?', N'["Couche Physique", "Couche Liaison", "Couche Réseau", "Couche Transport"]', 2, 'facile', 1, 2),
    (@RES_TestId, N'Quel port est utilisé par défaut par HTTPS ?', N'["80", "443", "21", "25"]', 1, 'moyen', 2, 3),
    (@RES_TestId, N'Quel protocole est principalement utilisé pour l''envoi d''emails ?', N'["POP3", "IMAP", "SMTP", "FTP"]', 2, 'moyen', 2, 4),
    (@RES_TestId, N'Quelle est la principale différence entre TCP et UDP ?', N'["TCP est toujours plus rapide", "UDP garantit la livraison ordonnée", "TCP garantit une livraison fiable et ordonnée", "UDP est orienté connexion"]', 2, 'difficile', 3, 5);
    DECLARE @RES_LastQ INT = SCOPE_IDENTITY();
    DECLARE @RES_Q1 INT = @RES_LastQ - 4;
    DECLARE @RES_Q2 INT = @RES_LastQ - 3;
    DECLARE @RES_Q3 INT = @RES_LastQ - 2;
    DECLARE @RES_Q4 INT = @RES_LastQ - 1;
    DECLARE @RES_Q5 INT = @RES_LastQ - 0;
END
GO

-- Sessions candidats — Test Réseaux - Notions fondamentales
BEGIN
    DECLARE @RES_TestId2 INT = (SELECT id FROM Tests WHERE access_code = 'RES2024');
    DECLARE @RES_S_Q1 INT;
    DECLARE @RES_S_Q2 INT;
    DECLARE @RES_S_Q3 INT;
    DECLARE @RES_S_Q4 INT;
    DECLARE @RES_S_Q5 INT;
    SELECT @RES_S_Q1 = MIN(id) FROM Questions WHERE test_id = @RES_TestId2;
    SET @RES_S_Q2 = @RES_S_Q1 + 1;
    SET @RES_S_Q3 = @RES_S_Q1 + 2;
    SET @RES_S_Q4 = @RES_S_Q1 + 3;
    SET @RES_S_Q5 = @RES_S_Q1 + 4;

    -- Candidat : Wael Trabelsi — score 100% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@RES_TestId2, N'Wael Trabelsi', N'wael.trabelsi@example.com', N'+216 20 555 666', 100, 9, 9, N'réussi', 980,
        N'[' + N'{"question_id":' + CAST(@RES_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@RES_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@RES_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@RES_S_Q4 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@RES_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 20, '2026-06-11 09:30:00'), '2026-06-11 09:30:00', DATEADD(SECOND, 980, '2026-06-11 09:30:00'));

    -- Candidat : Rania Belhadj — score 44% (échoué)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@RES_TestId2, N'Rania Belhadj', N'rania.belhadj@example.com', N'+216 22 666 777', 44, 4, 9, N'échoué', 700,
        N'[' + N'{"question_id":' + CAST(@RES_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@RES_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@RES_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@RES_S_Q4 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@RES_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3}' + N']',
        DATEADD(MINUTE, 20, '2026-06-14 15:00:00'), '2026-06-14 15:00:00', DATEADD(SECOND, 700, '2026-06-14 15:00:00'));

    -- Candidat : Omar Cherif — score 78% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@RES_TestId2, N'Omar Cherif', N'omar.cherif@example.com', N'+216 24 777 888', 78, 7, 9, N'réussi', 900,
        N'[' + N'{"question_id":' + CAST(@RES_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@RES_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@RES_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@RES_S_Q4 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@RES_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 20, '2026-06-19 10:00:00'), '2026-06-19 10:00:00', DATEADD(SECOND, 900, '2026-06-19 10:00:00'));

END
GO

-- =====================================================
-- TEST : Test Java - Programmation Orientée Objet
-- =====================================================
IF NOT EXISTS (SELECT * FROM Tests WHERE access_code = 'JAVA2024')
BEGIN
    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (N'Test Java - Programmation Orientée Objet', N'Évaluation des concepts de programmation orientée objet en Java (héritage, interfaces, collections).', N'Java', 35, 65, 'JAVA2024', @adminId);
    DECLARE @JAVA_TestId INT = SCOPE_IDENTITY();

    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@JAVA_TestId, N'Quel mot-clé permet à une classe d''hériter d''une autre classe en Java ?', N'["implements", "extends", "inherits", "super"]', 1, 'facile', 1, 1),
    (@JAVA_TestId, N'Quel mot-clé permet à une classe d''implémenter une interface ?', N'["extends", "implements", "interface", "abstract"]', 1, 'facile', 1, 2),
    (@JAVA_TestId, N'Comment appelle-t-on la méthode spéciale exécutée à la création d''un objet ?', N'["Destructeur", "Constructeur", "Accesseur", "Mutateur"]', 1, 'moyen', 2, 3),
    (@JAVA_TestId, N'Quelle collection Java garantit l''absence de doublons ?', N'["List", "Set", "Map", "Array"]', 1, 'moyen', 2, 4),
    (@JAVA_TestId, N'Quel principe de la POO permet de masquer les détails internes d''une classe ?', N'["Héritage", "Polymorphisme", "Encapsulation", "Abstraction"]', 2, 'difficile', 3, 5),
    (@JAVA_TestId, N'Que permet le polymorphisme en Java ?', N'["Créer plusieurs constructeurs", "Redéfinir une méthode dans une sous-classe et l''appeler via le type parent", "Empêcher l''héritage", "Rendre une classe finale"]', 1, 'difficile', 3, 6);
    DECLARE @JAVA_LastQ INT = SCOPE_IDENTITY();
    DECLARE @JAVA_Q1 INT = @JAVA_LastQ - 5;
    DECLARE @JAVA_Q2 INT = @JAVA_LastQ - 4;
    DECLARE @JAVA_Q3 INT = @JAVA_LastQ - 3;
    DECLARE @JAVA_Q4 INT = @JAVA_LastQ - 2;
    DECLARE @JAVA_Q5 INT = @JAVA_LastQ - 1;
    DECLARE @JAVA_Q6 INT = @JAVA_LastQ - 0;
END
GO

-- Sessions candidats — Test Java - Programmation Orientée Objet
BEGIN
    DECLARE @JAVA_TestId2 INT = (SELECT id FROM Tests WHERE access_code = 'JAVA2024');
    DECLARE @JAVA_S_Q1 INT;
    DECLARE @JAVA_S_Q2 INT;
    DECLARE @JAVA_S_Q3 INT;
    DECLARE @JAVA_S_Q4 INT;
    DECLARE @JAVA_S_Q5 INT;
    DECLARE @JAVA_S_Q6 INT;
    SELECT @JAVA_S_Q1 = MIN(id) FROM Questions WHERE test_id = @JAVA_TestId2;
    SET @JAVA_S_Q2 = @JAVA_S_Q1 + 1;
    SET @JAVA_S_Q3 = @JAVA_S_Q1 + 2;
    SET @JAVA_S_Q4 = @JAVA_S_Q1 + 3;
    SET @JAVA_S_Q5 = @JAVA_S_Q1 + 4;
    SET @JAVA_S_Q6 = @JAVA_S_Q1 + 5;

    -- Candidat : Mohamed Amine Sfaxi — score 100% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@JAVA_TestId2, N'Mohamed Amine Sfaxi', N'mohamedamine.sfaxi@example.com', N'+216 20 888 999', 100, 12, 12, N'réussi', 1800,
        N'[' + N'{"question_id":' + CAST(@JAVA_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3},' + N'{"question_id":' + CAST(@JAVA_S_Q6 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 35, '2026-06-09 08:45:00'), '2026-06-09 08:45:00', DATEADD(SECOND, 1800, '2026-06-09 08:45:00'));

    -- Candidat : Leila Guesmi — score 50% (échoué)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@JAVA_TestId2, N'Leila Guesmi', N'leila.guesmi@example.com', N'+216 22 999 000', 50, 6, 12, N'échoué', 1400,
        N'[' + N'{"question_id":' + CAST(@JAVA_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3},' + N'{"question_id":' + CAST(@JAVA_S_Q6 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":3}' + N']',
        DATEADD(MINUTE, 35, '2026-06-13 13:30:00'), '2026-06-13 13:30:00', DATEADD(SECOND, 1400, '2026-06-13 13:30:00'));

    -- Candidat : Firas Jendoubi — score 83% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@JAVA_TestId2, N'Firas Jendoubi', N'firas.jendoubi@example.com', N'+216 24 000 111', 83, 10, 12, N'réussi', 1650,
        N'[' + N'{"question_id":' + CAST(@JAVA_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3},' + N'{"question_id":' + CAST(@JAVA_S_Q6 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 35, '2026-06-17 09:15:00'), '2026-06-17 09:15:00', DATEADD(SECOND, 1650, '2026-06-17 09:15:00'));

    -- Candidat : Emna Sassi — score 50% (échoué)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@JAVA_TestId2, N'Emna Sassi', N'emna.sassi@example.com', N'+216 26 111 222', 50, 6, 12, N'échoué', 1500,
        N'[' + N'{"question_id":' + CAST(@JAVA_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":1},' + N'{"question_id":' + CAST(@JAVA_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q4 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@JAVA_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3},' + N'{"question_id":' + CAST(@JAVA_S_Q6 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":3}' + N']',
        DATEADD(MINUTE, 35, '2026-06-20 14:00:00'), '2026-06-20 14:00:00', DATEADD(SECOND, 1500, '2026-06-20 14:00:00'));

END
GO

-- =====================================================
-- TEST : Test React - Développement Frontend
-- =====================================================
IF NOT EXISTS (SELECT * FROM Tests WHERE access_code = 'REACT2024')
BEGIN
    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (N'Test React - Développement Frontend', N'Évaluation des compétences en développement d''interfaces avec React (hooks, props, optimisation).', N'React', 30, 60, 'REACT2024', @adminId);
    DECLARE @REACT_TestId INT = SCOPE_IDENTITY();

    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@REACT_TestId, N'Quel hook permet de gérer un état local dans un composant fonctionnel ?', N'["useEffect", "useState", "useContext", "useRef"]', 1, 'facile', 1, 1),
    (@REACT_TestId, N'Quel hook permet d''exécuter du code après le rendu d''un composant ?', N'["useState", "useMemo", "useEffect", "useReducer"]', 2, 'facile', 1, 2),
    (@REACT_TestId, N'Comment appelle-t-on les données passées à un composant enfant ?', N'["State", "Props", "Context", "Refs"]', 1, 'moyen', 2, 3),
    (@REACT_TestId, N'Quel hook permet d''optimiser le rendu en mémorisant une valeur calculée ?', N'["useState", "useMemo", "useEffect", "useCallback"]', 1, 'moyen', 2, 4),
    (@REACT_TestId, N'Quel est le rôle de la clé (key) dans une liste d''éléments React ?', N'["Trier les éléments", "Styliser les éléments", "Aider React à identifier les éléments modifiés", "Définir l''ordre CSS"]', 2, 'difficile', 3, 5);
    DECLARE @REACT_LastQ INT = SCOPE_IDENTITY();
    DECLARE @REACT_Q1 INT = @REACT_LastQ - 4;
    DECLARE @REACT_Q2 INT = @REACT_LastQ - 3;
    DECLARE @REACT_Q3 INT = @REACT_LastQ - 2;
    DECLARE @REACT_Q4 INT = @REACT_LastQ - 1;
    DECLARE @REACT_Q5 INT = @REACT_LastQ - 0;
END
GO

-- Sessions candidats — Test React - Développement Frontend
BEGIN
    DECLARE @REACT_TestId2 INT = (SELECT id FROM Tests WHERE access_code = 'REACT2024');
    DECLARE @REACT_S_Q1 INT;
    DECLARE @REACT_S_Q2 INT;
    DECLARE @REACT_S_Q3 INT;
    DECLARE @REACT_S_Q4 INT;
    DECLARE @REACT_S_Q5 INT;
    SELECT @REACT_S_Q1 = MIN(id) FROM Questions WHERE test_id = @REACT_TestId2;
    SET @REACT_S_Q2 = @REACT_S_Q1 + 1;
    SET @REACT_S_Q3 = @REACT_S_Q1 + 2;
    SET @REACT_S_Q4 = @REACT_S_Q1 + 3;
    SET @REACT_S_Q5 = @REACT_S_Q1 + 4;

    -- Candidat : Yassine Khemiri — score 100% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@REACT_TestId2, N'Yassine Khemiri', N'yassine.khemiri@example.com', N'+216 20 222 333', 100, 9, 9, N'réussi', 1500,
        N'[' + N'{"question_id":' + CAST(@REACT_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@REACT_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@REACT_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@REACT_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@REACT_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 30, '2026-06-16 10:30:00'), '2026-06-16 10:30:00', DATEADD(SECOND, 1500, '2026-06-16 10:30:00'));

    -- Candidat : Hiba Dridi — score 44% (échoué)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@REACT_TestId2, N'Hiba Dridi', N'hiba.dridi@example.com', N'+216 22 333 444', 44, 4, 9, N'échoué', 1100,
        N'[' + N'{"question_id":' + CAST(@REACT_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@REACT_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@REACT_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@REACT_S_Q4 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@REACT_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3}' + N']',
        DATEADD(MINUTE, 30, '2026-06-21 11:00:00'), '2026-06-21 11:00:00', DATEADD(SECOND, 1100, '2026-06-21 11:00:00'));

    -- Candidat : Bilel Mejri — score 78% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@REACT_TestId2, N'Bilel Mejri', N'bilel.mejri@example.com', N'+216 24 444 555', 78, 7, 9, N'réussi', 1300,
        N'[' + N'{"question_id":' + CAST(@REACT_S_Q1 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@REACT_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@REACT_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@REACT_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@REACT_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 30, '2026-06-24 09:45:00'), '2026-06-24 09:45:00', DATEADD(SECOND, 1300, '2026-06-24 09:45:00'));

END
GO

-- =====================================================
-- TEST : Test ERP/SAP - Bases fonctionnelles
-- =====================================================
IF NOT EXISTS (SELECT * FROM Tests WHERE access_code = 'ERP2024')
BEGIN
    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (N'Test ERP/SAP - Bases fonctionnelles', N'Évaluation des connaissances fonctionnelles de base sur les systèmes ERP et les modules SAP.', N'ERP', 25, 60, 'ERP2024', @adminId);
    DECLARE @ERP_TestId INT = SCOPE_IDENTITY();

    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@ERP_TestId, N'Que signifie l''acronyme ERP ?', N'["Enterprise Resource Planning", "Enterprise Report Processing", "External Resource Program", "Enterprise Resource Process"]', 0, 'facile', 1, 1),
    (@ERP_TestId, N'Quel module SAP gère la gestion des ventes et de la distribution ?', N'["MM", "SD", "FI", "HR"]', 1, 'facile', 1, 2),
    (@ERP_TestId, N'Quel module SAP gère les achats et la gestion des stocks ?', N'["MM", "SD", "CO", "PP"]', 0, 'moyen', 2, 3),
    (@ERP_TestId, N'Quel est l''objectif principal d''un système ERP ?', N'["Gérer uniquement la paie", "Centraliser et intégrer les processus de l''entreprise", "Remplacer les employés", "Gérer uniquement le marketing"]', 1, 'moyen', 2, 4),
    (@ERP_TestId, N'Quel module SAP est dédié à la comptabilité financière ?', N'["FI", "PP", "QM", "PM"]', 0, 'difficile', 3, 5);
    DECLARE @ERP_LastQ INT = SCOPE_IDENTITY();
    DECLARE @ERP_Q1 INT = @ERP_LastQ - 4;
    DECLARE @ERP_Q2 INT = @ERP_LastQ - 3;
    DECLARE @ERP_Q3 INT = @ERP_LastQ - 2;
    DECLARE @ERP_Q4 INT = @ERP_LastQ - 1;
    DECLARE @ERP_Q5 INT = @ERP_LastQ - 0;
END
GO

-- Sessions candidats — Test ERP/SAP - Bases fonctionnelles
BEGIN
    DECLARE @ERP_TestId2 INT = (SELECT id FROM Tests WHERE access_code = 'ERP2024');
    DECLARE @ERP_S_Q1 INT;
    DECLARE @ERP_S_Q2 INT;
    DECLARE @ERP_S_Q3 INT;
    DECLARE @ERP_S_Q4 INT;
    DECLARE @ERP_S_Q5 INT;
    SELECT @ERP_S_Q1 = MIN(id) FROM Questions WHERE test_id = @ERP_TestId2;
    SET @ERP_S_Q2 = @ERP_S_Q1 + 1;
    SET @ERP_S_Q3 = @ERP_S_Q1 + 2;
    SET @ERP_S_Q4 = @ERP_S_Q1 + 3;
    SET @ERP_S_Q5 = @ERP_S_Q1 + 4;

    -- Candidat : Marwa Kthiri — score 100% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@ERP_TestId2, N'Marwa Kthiri', N'marwa.kthiri@example.com', N'+216 20 555 111', 100, 9, 9, N'réussi', 1200,
        N'[' + N'{"question_id":' + CAST(@ERP_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@ERP_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@ERP_S_Q3 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@ERP_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@ERP_S_Q5 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 25, '2026-06-22 10:00:00'), '2026-06-22 10:00:00', DATEADD(SECOND, 1200, '2026-06-22 10:00:00'));

    -- Candidat : Anis Jelassi — score 44% (échoué)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@ERP_TestId2, N'Anis Jelassi', N'anis.jelassi@example.com', N'+216 22 666 222', 44, 4, 9, N'échoué', 850,
        N'[' + N'{"question_id":' + CAST(@ERP_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@ERP_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@ERP_S_Q3 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":0,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@ERP_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@ERP_S_Q5 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":0,"is_correct":false,"points":3}' + N']',
        DATEADD(MINUTE, 25, '2026-06-25 15:30:00'), '2026-06-25 15:30:00', DATEADD(SECOND, 850, '2026-06-25 15:30:00'));

    -- Candidat : Salma Bouazizi — score 89% (réussi)
    INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
    VALUES (@ERP_TestId2, N'Salma Bouazizi', N'salma.bouazizi@example.com', N'+216 24 777 333', 89, 8, 9, N'réussi', 1000,
        N'[' + N'{"question_id":' + CAST(@ERP_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@ERP_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":1},' + N'{"question_id":' + CAST(@ERP_S_Q3 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@ERP_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@ERP_S_Q5 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":3}' + N']',
        DATEADD(MINUTE, 25, '2026-06-27 09:00:00'), '2026-06-27 09:00:00', DATEADD(SECOND, 1000, '2026-06-27 09:00:00'));

END
GO

-- =====================================================
-- Sessions candidats — Test JavaScript déjà existant (JS2024, cree par init-db.sql)
-- =====================================================
IF EXISTS (SELECT * FROM Tests WHERE access_code = 'JS2024')
BEGIN
    DECLARE @JS_TestId2 INT = (SELECT id FROM Tests WHERE access_code = 'JS2024');
    DECLARE @JS_S_Q1 INT, @JS_S_Q2 INT, @JS_S_Q3 INT, @JS_S_Q4 INT, @JS_S_Q5 INT;
    SELECT @JS_S_Q1 = MIN(id) FROM Questions WHERE test_id = @JS_TestId2;
    SET @JS_S_Q2 = @JS_S_Q1 + 1;
    SET @JS_S_Q3 = @JS_S_Q1 + 2;
    SET @JS_S_Q4 = @JS_S_Q1 + 3;
    SET @JS_S_Q5 = @JS_S_Q1 + 4;

    IF NOT EXISTS (SELECT * FROM CandidateSessions WHERE test_id = @JS_TestId2 AND candidate_email = 'nadia.ayari@example.com')
    BEGIN
        -- Candidat : Nadia Ayari — score 100% (réussi)
        INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
        VALUES (@JS_TestId2, N'Nadia Ayari', N'nadia.ayari@example.com', N'+216 20 123 987', 100, 9, 9, N'réussi', 1400,
            N'[' + N'{"question_id":' + CAST(@JS_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JS_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JS_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JS_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JS_S_Q5 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":3}' + N']',
            DATEADD(MINUTE, 30, '2026-06-08 09:00:00'), '2026-06-08 09:00:00', DATEADD(SECOND, 1400, '2026-06-08 09:00:00'));

        -- Candidat : Walid Haddad — score 44% (échoué)
        INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
        VALUES (@JS_TestId2, N'Walid Haddad', N'walid.haddad@example.com', N'+216 22 234 098', 44, 4, 9, N'échoué', 1000,
            N'[' + N'{"question_id":' + CAST(@JS_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JS_S_Q2 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":1,"is_correct":false,"points":2},' + N'{"question_id":' + CAST(@JS_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JS_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JS_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3}' + N']',
            DATEADD(MINUTE, 30, '2026-06-13 15:00:00'), '2026-06-13 15:00:00', DATEADD(SECOND, 1000, '2026-06-13 15:00:00'));

        -- Candidat : Ghassen Barhoumi — score 67% (réussi)
        INSERT INTO CandidateSessions (test_id, candidate_name, candidate_email, candidate_phone, score, earned_points, total_points, status, time_taken_seconds, answers_json, expires_at, started_at, submitted_at)
        VALUES (@JS_TestId2, N'Ghassen Barhoumi', N'ghassen.barhoumi@example.com', N'+216 24 345 109', 67, 6, 9, N'réussi', 1250,
            N'[' + N'{"question_id":' + CAST(@JS_S_Q1 AS NVARCHAR) + N',"candidate_answer":0,"correct_answer":0,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JS_S_Q2 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JS_S_Q3 AS NVARCHAR) + N',"candidate_answer":2,"correct_answer":2,"is_correct":true,"points":1},' + N'{"question_id":' + CAST(@JS_S_Q4 AS NVARCHAR) + N',"candidate_answer":1,"correct_answer":1,"is_correct":true,"points":2},' + N'{"question_id":' + CAST(@JS_S_Q5 AS NVARCHAR) + N',"candidate_answer":3,"correct_answer":2,"is_correct":false,"points":3}' + N']',
            DATEADD(MINUTE, 30, '2026-06-17 10:30:00'), '2026-06-17 10:30:00', DATEADD(SECOND, 1250, '2026-06-17 10:30:00'));
    END
END
GO

PRINT 'Données de test insérées avec succès : 5 tests techniques + questions + sessions candidats (incl. test JS existant).';
GO