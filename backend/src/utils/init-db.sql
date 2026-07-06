-- =====================================================
-- StageDélice / TechTest Platform
-- Database initialization script (Microsoft SQL Server)
--
-- This script is the SINGLE SOURCE OF TRUTH for the schema.
-- Column names are lowercase snake_case because that is what
-- every active controller in backend/src/controllers queries.
-- Run with: sqlcmd -S <server> -i init-db.sql
-- =====================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TechTestDB')
BEGIN
    CREATE DATABASE TechTestDB;
END
GO

USE TechTestDB;
GO

-- =====================================================
-- TABLE: Users
-- Admins (role='admin') and HR recruiters (role='rh').
-- Candidates are NOT stored here: they never authenticate,
-- they access a test through its public access_code.
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Users' AND xtype = 'U')
BEGIN
    CREATE TABLE Users (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        full_name     NVARCHAR(100)  NOT NULL,
        email         NVARCHAR(150)  NOT NULL UNIQUE,
        password_hash NVARCHAR(255)  NOT NULL,
        role          NVARCHAR(20)   NOT NULL DEFAULT 'rh', -- 'admin' | 'rh'
        is_active     BIT            NOT NULL DEFAULT 1,
        created_at    DATETIME       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- =====================================================
-- TABLE: Tests
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Tests' AND xtype = 'U')
BEGIN
    CREATE TABLE Tests (
        id                INT IDENTITY(1,1) PRIMARY KEY,
        title             NVARCHAR(200)  NOT NULL,
        description       NVARCHAR(MAX),
        category          NVARCHAR(100),          -- SQL, JavaScript, Réseau, ERP...
        duration_minutes  INT            NOT NULL DEFAULT 30,
        passing_score     INT            NOT NULL DEFAULT 60, -- % minimum to pass
        access_code       NVARCHAR(20)   NOT NULL UNIQUE,     -- Public code used by candidates
        is_active         BIT            NOT NULL DEFAULT 1,
        created_by        INT            NOT NULL,
        created_at        DATETIME       NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES Users(id)
    );
END
GO

-- =====================================================
-- TABLE: Questions
-- Options are stored as a JSON array of strings (parsed
-- client-side / in controllers with JSON.parse). correct_answer
-- holds the zero-based index of the right option in that array.
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Questions' AND xtype = 'U')
BEGIN
    CREATE TABLE Questions (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        test_id         INT            NOT NULL,
        text            NVARCHAR(MAX)  NOT NULL,
        options         NVARCHAR(MAX)  NOT NULL, -- JSON array, e.g. ["A","B","C","D"]
        correct_answer  INT            NOT NULL, -- index into `options`
        difficulty      NVARCHAR(20)   NOT NULL DEFAULT 'moyen', -- facile | moyen | difficile
        points          INT            NOT NULL DEFAULT 1,
        position        INT            NOT NULL DEFAULT 0,
        created_at      DATETIME       NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (test_id) REFERENCES Tests(id) ON DELETE CASCADE
    );
END
GO

-- =====================================================
-- TABLE: CandidateSessions
-- One row per candidate attempt of a test.
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'CandidateSessions' AND xtype = 'U')
BEGIN
    CREATE TABLE CandidateSessions (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        test_id             INT            NOT NULL,
        candidate_name      NVARCHAR(150)  NOT NULL,
        candidate_email     NVARCHAR(150)  NOT NULL,
        candidate_phone     NVARCHAR(30),
        score               INT,                     -- Percentage (0-100)
        earned_points       INT,
        total_points        INT,
        status              NVARCHAR(20),            -- 'réussi' | 'échoué'
        time_taken_seconds  INT,
        answers_json        NVARCHAR(MAX),           -- Detailed per-question breakdown
        expires_at          DATETIME       NOT NULL,
        started_at          DATETIME       NOT NULL DEFAULT GETDATE(),
        submitted_at        DATETIME,
        created_at          DATETIME       NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (test_id) REFERENCES Tests(id)
    );
END
GO

-- =====================================================
-- DEFAULT ADMIN USER
-- Email: admin@stagedelice.com
-- Password: Admin@123 (bcrypt hash below)
-- Change this password immediately after first login.
-- =====================================================
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@stagedelice.com')
BEGIN
    INSERT INTO Users (full_name, email, password_hash, role)
    VALUES (
        'Administrateur',
        'admin@stagedelice.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
        'admin'
    );
END
GO

-- =====================================================
-- SAMPLE HR USER
-- Email: rh@stagedelice.com / Password: Admin@123 (demo hash reused)
-- =====================================================
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'rh@stagedelice.com')
BEGIN
    INSERT INTO Users (full_name, email, password_hash, role)
    VALUES (
        'Responsable RH',
        'rh@stagedelice.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
        'rh'
    );
END
GO

-- =====================================================
-- SAMPLE TEST: JavaScript quiz (5 questions)
-- =====================================================
IF NOT EXISTS (SELECT * FROM Tests WHERE title = 'Test JavaScript - Niveau Intermediaire')
BEGIN
    DECLARE @AdminId INT = (SELECT id FROM Users WHERE email = 'admin@stagedelice.com');
    DECLARE @TestId  INT;

    INSERT INTO Tests (title, description, category, duration_minutes, passing_score, access_code, created_by)
    VALUES (
        'Test JavaScript - Niveau Intermediaire',
        N'Évaluation des connaissances JavaScript pour développeurs web',
        'JavaScript', 30, 60, 'JS2024', @AdminId
    );
    SET @TestId = SCOPE_IDENTITY();

    INSERT INTO Questions (test_id, text, options, correct_answer, difficulty, points, position) VALUES
    (@TestId, N'Quelle methode permet d''ajouter un element a la fin d''un tableau ?', N'["push()","pop()","shift()","unshift()"]', 0, 'facile', 1, 1),
    (@TestId, N'Que retourne typeof null ?', N'["\"null\"","\"object\"","\"undefined\"","\"number\""]', 1, 'moyen', 2, 2),
    (@TestId, N'Quel mot-cle declare une variable dont la reference ne peut pas etre reassignee ?', N'["var","let","const","static"]', 2, 'facile', 1, 3),
    (@TestId, N'Quelle methode sert a transformer chaque element d''un tableau ?', N'["forEach()","map()","filter()","reduce()"]', 1, 'moyen', 2, 4),
    (@TestId, N'Que fait Promise.all() ?', N'["Resout des la premiere promesse", "Rejette toutes les promesses", "Attend que toutes les promesses soient resolues", "Annule les promesses en attente"]', 2, 'difficile', 3, 5);
END
GO

PRINT 'Base de donnees TechTestDB initialisee avec succes !';
GO
