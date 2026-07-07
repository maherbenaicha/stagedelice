# Module Talent AI — Documentation

## Vue d'ensemble

Le module **Talent AI** étend StageDélice avec un pipeline de recrutement intelligent basé sur l'IA Groq (Llama 3.3 70B), sans modifier les fonctionnalités existantes (tests techniques, sessions candidats, dashboard classique).

## Prérequis

1. **Base de données** : exécuter le script SQL mis à jour :
   ```bash
   sqlcmd -S localhost -U sa -P <password> -i backend/src/utils/init-db.sql
   ```
   Les nouvelles tables sont créées uniquement si elles n'existent pas (`IF NOT EXISTS`).

2. **Variables d'environnement** (backend `.env`) :
   ```
   GROQ_API_KEY=votre_cle_groq
   JWT_SECRET=...
   DB_SERVER=localhost
   DB_DATABASE=TechTestDB
   DB_USER=sa
   DB_PASSWORD=...
   ```

3. **Dépendances backend** :
   ```bash
   cd backend && npm install
   ```

## Architecture

### Nouvelles tables SQL Server

| Table | Rôle |
|-------|------|
| `JobOffers` | Offres d'emploi (brouillon / publié) |
| `RecruitmentPipelines` | Étapes du parcours de recrutement (JSON) |
| `Candidates` | Candidats importés via CV |
| `CandidateCVs` | Fichiers PDF + texte extrait |
| `CandidateCVExtracts` | Données structurées extraites par l'IA |
| `CandidateApplications` | Lien candidat ↔ offre + synthèse IA |
| `CandidateCompatibilityScores` | Scores détaillés de compatibilité |
| `EmailTemplates` | Templates d'emails dynamiques |
| `EmailLogs` | Emails générés (brouillon) |

### API REST

#### Offres d'emploi — `/api/job-offers`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des offres |
| GET | `/:id` | Détail + pipeline |
| POST | `/generate` | Génération IA (preview) |
| POST | `/` | Créer offre + pipeline IA auto |
| PUT | `/:id` | Modifier offre |
| PUT | `/:id/pipeline` | Modifier les étapes |
| POST | `/:id/pipeline/regenerate` | Régénérer pipeline IA |

#### Talent AI — `/api/talent`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/dashboard` | Statistiques + insights IA |
| GET | `/applications` | Candidats analysés (filtres) |
| GET | `/applications/:id` | Fiche candidat complète |
| GET | `/offers/:offerId/ranking` | Top candidats par score |
| POST | `/offers/:offerId/cvs` | Upload PDF (multipart, champ `cvs`) |
| POST | `/emails/generate` | Générer email personnalisé |
| GET | `/emails/templates` | Liste templates |
| POST | `/emails/templates` | Sauvegarder template |
| GET | `/emails/logs` | Historique emails |

#### Filtres candidats (`GET /api/talent/applications`)

- `job_offer_id` — filtrer par offre
- `sort` — `score` (défaut) ou `experience`
- `skill` — compétence (ex: React)
- `min_experience` — années minimum
- `diploma` — filtre diplôme
- `min_score` — score minimum (%)

### Pages frontend

| Route | Page |
|-------|------|
| `/dashboard/talent` | Dashboard IA (stats, graphiques, insights) |
| `/dashboard/talent/offers` | Création offres avec IA |
| `/dashboard/talent/offers/:id` | Détail offre, upload CV, pipeline, ranking |
| `/dashboard/talent/candidates` | Liste candidats analysés + filtres |
| `/dashboard/talent/candidates/:id` | Fiche IA, scores, email personnalisé |

## Workflow RH

1. **Créer une offre** : Offres IA → saisir poste/niveau/technologies → Générer IA → modifier → Publier
2. **Pipeline auto** : généré à la création, modifiable sur la page offre
3. **Importer CV** : page offre → sélectionner PDF → Analyser (extraction + scoring + synthèse)
4. **Consulter candidats** : Talent AI → filtres + classement
5. **Fiche détaillée** : scores, points forts/faibles, recommandation, email IA

## Fichiers ajoutés/modifiés

### Backend
- `src/services/geminiService.js` — fonctions IA étendues
- `src/utils/pdfParser.js` — extraction texte PDF
- `src/middleware/upload.js` — upload multer
- `src/controllers/jobOfferController.js`
- `src/controllers/talentController.js`
- `src/controllers/emailController.js`
- `src/routes/jobOffers.js`
- `src/routes/talent.js`
- `src/utils/init-db.sql` — nouvelles tables
- `src/server.js` — nouvelles routes

### Frontend
- `src/pages/TalentDashboardPage.js`
- `src/pages/JobOffersPage.js`
- `src/pages/JobOfferDetailPage.js`
- `src/pages/TalentCandidatesPage.js`
- `src/pages/TalentCandidateDetailPage.js`
- `src/App.js`, `src/components/layout/Layout.js`

## Notes techniques

- Les CV PDF sont stockés dans `backend/uploads/cvs/`
- L'envoi réel d'emails n'est pas implémenté (statut `draft`) — extensible via SMTP
- L'endpoint existant `/api/ai/generate-questions` reste inchangé
- Le dashboard classique `/dashboard` et la page Candidats tests restent fonctionnels
