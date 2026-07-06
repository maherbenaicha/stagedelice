# StageDélice 🧪

**StageDélice** est une plateforme d'évaluation technique en ligne (dans l'esprit de HackerRank / TestGorilla) qui permet aux équipes RH de créer des tests techniques, de générer automatiquement des questions grâce à l'IA, et de faire passer ces tests à des candidats via un simple lien — sans que ceux-ci aient besoin de créer de compte.

---

## 📌 Présentation

### Description du projet

StageDélice couvre l'ensemble du cycle d'évaluation technique d'un candidat :

1. Un **admin** ou un **RH** se connecte et crée un test (titre, catégorie, durée, seuil de réussite).
2. Il ajoute des questions à choix multiples manuellement, **ou les génère automatiquement avec l'IA** (Google Gemini) en indiquant simplement une technologie et un niveau de difficulté.
3. Le test génère un **code d'accès unique** que le RH transmet au candidat.
4. Le **candidat**, sans compte ni mot de passe, saisit le code, renseigne son nom/email, et passe le test dans une interface chronométrée.
5. La correction est automatique et instantanée ; le résultat est enregistré et consultable dans le tableau de bord.

### Objectif

Réduire le temps passé par les équipes RH à concevoir des évaluations techniques et à corriger des tests manuellement, tout en offrant aux candidats une expérience de passation simple et rapide.

### Cas d'utilisation

| Rôle | Ce qu'il peut faire |
|---|---|
| **Admin** | Tout ce que peut faire un RH, + gestion des comptes utilisateurs (créer/désactiver des comptes RH ou Admin) |
| **RH** | Créer/modifier/désactiver des tests, ajouter des questions (manuellement ou via l'IA), consulter les candidatures et résultats, exporter les résultats en Excel/PDF |
| **Candidat** | Accéder à un test via son code, le passer dans le temps imparti, consulter son résultat immédiatement après soumission — aucune authentification requise |

---

## 🏗 Architecture

```
stagedelice/
├── backend/                 # API REST (Node.js / Express)
│   ├── src/
│   │   ├── config/          # Configuration de la connexion SQL Server
│   │   ├── controllers/     # Logique métier de chaque ressource
│   │   ├── middleware/      # Authentification JWT, contrôle des rôles
│   │   ├── routes/          # Déclaration des routes Express par ressource
│   │   ├── services/        # Intégrations externes (Gemini AI)
│   │   ├── utils/           # Script SQL d'initialisation + seed
│   │   └── server.js        # Point d'entrée de l'application
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # Application React (SPA)
│   ├── public/                # Fichiers statiques (images, index.html)
│   ├── src/
│   │   ├── components/layout/ # Mise en page du back-office (sidebar, etc.)
│   │   ├── context/            # Contexte d'authentification global (AuthContext)
│   │   ├── pages/               # Une page par écran (Dashboard, Tests, Login...)
│   │   ├── styles/              # Feuille de style globale
│   │   ├── utils/                # Client HTTP (axios) préconfiguré
│   │   └── App.js                 # Déclaration des routes
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

### Frontend / Backend / Database

- **Frontend** : React 18 + React Router 6, appels HTTP via Axios, notifications via `react-hot-toast`, icônes via `lucide-react`. Aucune dépendance à un state manager externe : l'état d'authentification est géré par un unique `AuthContext` basé sur `localStorage`.
- **Backend** : Node.js + Express. Chaque ressource (auth, users, tests, sessions, reports, ai) a son propre routeur et son propre contrôleur. L'authentification repose sur des JSON Web Tokens (JWT).
- **Database** : Microsoft SQL Server. Le schéma est décrit intégralement dans `backend/src/utils/init-db.sql`, qui fait foi (les noms de colonnes en `snake_case` correspondent exactement à ce que les contrôleurs interrogent).

### Explication des dossiers

- **`backend/src/config/database.js`** : ouvre et réutilise un pool de connexions `mssql`.
- **`backend/src/controllers/`** : un fichier par ressource métier (`authController`, `userController`, `testController`, `questionController`, `sessionController`, `reportController`, `aiController`).
- **`backend/src/services/geminiService.js`** : encapsule l'appel à l'API Google Gemini et le parsing de sa réponse JSON.
- **`frontend/src/context/AuthContext.js`** : source unique de vérité de la session utilisateur (token + infos utilisateur, persistés dans `localStorage` sous les clés `tt_token` / `tt_user`).
- **`frontend/src/pages/`** : chaque écran de l'application (back-office RH/Admin et parcours candidat) est isolé dans son propre composant.

---

## ⚙️ Installation

### Prérequis

- Node.js 18+
- Une instance Microsoft SQL Server accessible (locale, Docker, ou distante)
- Une clé API Google Gemini (facultative, uniquement nécessaire pour la génération de questions par IA)

### Base de données

```bash
# Depuis SQL Server Management Studio, Azure Data Studio ou sqlcmd :
sqlcmd -S <votre_serveur> -i backend/src/utils/init-db.sql

# Ou, une fois le backend configuré (voir ci-dessous) :
cd backend
npm run seed
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # puis renseignez vos propres valeurs
npm run dev             # démarrage avec rechargement automatique (nodemon)
# ou : npm start          pour un démarrage en mode production
```

L'API démarre par défaut sur `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # ajustez REACT_APP_API_URL si nécessaire
npm start
```

L'application démarre par défaut sur `http://localhost:3000`.

---

## 🔐 Variables d'environnement

### Backend (`backend/.env`)

```
PORT=5000
FRONTEND_URL=http://localhost:3000

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h

DB_SERVER=localhost
DB_DATABASE=TechTestDB
DB_USER=sa
DB_PASSWORD=change_this_password
DB_PORT=1433

GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Description |
|---|---|
| `PORT` | Port d'écoute de l'API |
| `FRONTEND_URL` | Origine autorisée par la politique CORS |
| `JWT_SECRET` | Clé secrète de signature des tokens JWT — **à générer aléatoirement**, jamais la valeur par défaut |
| `JWT_EXPIRES_IN` | Durée de validité d'un token |
| `DB_SERVER` / `DB_DATABASE` / `DB_USER` / `DB_PASSWORD` / `DB_PORT` | Paramètres de connexion SQL Server |
| `GEMINI_API_KEY` | Clé de l'API Google Gemini utilisée pour la génération de questions ; sans elle, la génération IA renverra une erreur explicite mais le reste de la plateforme fonctionne normalement |

### Frontend (`frontend/.env`)

```
REACT_APP_API_URL=http://localhost:5000/api
```

⚠️ **Aucun fichier `.env` réel n'est commité** : seuls les fichiers `.env.example` font partie du dépôt. Copiez-les et renseignez vos propres secrets localement.

---

## 🚀 Fonctionnalités

- **Authentification JWT** avec expiration configurable et rafraîchissement de session côté client
- **Gestion des rôles** : `admin` (accès total, y compris gestion des comptes) et `rh` (gestion des tests et des candidatures)
- **Génération IA de questions** : à partir d'une technologie et d'un niveau, Gemini génère des QCM prêts à l'emploi, insérés directement dans le test
- **Création et gestion de tests** : titre, description, catégorie, durée, seuil de réussite, code d'accès unique généré automatiquement
- **Passage de test candidat** sans compte, avec minuteur et soumission automatique à expiration du temps
- **Correction automatique** et calcul du score en pourcentage dès la soumission
- **Dashboard RH/Admin** : statistiques globales, taux de réussite par test, dernières sessions
- **Export des résultats** en Excel (`exceljs`) et PDF (`pdfkit`)
- **Changement de mot de passe** depuis la page de profil

---

## 🤖 IA intégrée

La génération de questions repose sur **Google Gemini 1.5 Flash**, appelé depuis `backend/src/services/geminiService.js`.

### Comment ça marche

1. Le RH renseigne une **technologie** (ex : `React`, `SQL`, `Docker`), un **niveau** (`facile`, `moyen`, `difficile`) et un **nombre de questions** souhaité (1 à 15).
2. Le backend construit un prompt structuré en français demandant à Gemini de répondre **exclusivement** en JSON, avec un format strict (4 options par question, index de la bonne réponse).
3. La réponse est parsée, validée (4 options exactement, champs requis présents) et, si `save: true`, insérée directement dans la table `Questions` du test concerné — sinon renvoyée pour relecture avant enregistrement.

### Endpoint

```
POST /api/ai/generate-questions
Authorization: Bearer <token>

{
  "technology": "React",
  "level": "moyen",
  "count": 5,
  "test_id": 3,        // optionnel
  "save": true          // optionnel — enregistre directement si test_id est fourni
}
```

### Paramètres

| Paramètre | Type | Description |
|---|---|---|
| `technology` | string | Technologie ciblée (obligatoire) |
| `level` | string | `facile` \| `moyen` \| `difficile` (défaut : `moyen`) |
| `count` | number | Nombre de questions à générer, 1 à 15 (défaut : 5) |
| `test_id` | number | Identifiant du test dans lequel enregistrer les questions |
| `save` | boolean | `true` pour persister directement en base, `false` pour prévisualiser |

Dans l'interface, ce flux est accessible via le bouton **✨ Générer avec l'IA** sur la page de détail d'un test.

---

## 📊 Modules

### Admin
- Gestion complète des comptes utilisateurs (créer, modifier, désactiver)
- Accès à l'ensemble des fonctionnalités RH

### RH
- Création et administration des tests techniques
- Génération de questions par IA ou saisie manuelle
- Suivi des candidatures et des résultats
- Export des résultats (Excel / PDF)
- Tableau de bord avec statistiques de réussite

### Candidat
- Accès au test via un code unique, sans inscription
- Interface de passation chronométrée
- Résultat affiché immédiatement après soumission

---

## 🧪 API Routes

Toutes les routes sont préfixées par `/api`.

### Auth
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Connexion (email + mot de passe) |
| GET | `/auth/profile` | Authentifié | Profil de l'utilisateur connecté |
| PUT | `/auth/password` | Authentifié | Changement de mot de passe |

### Users (Admin uniquement)
| Méthode | Route | Description |
|---|---|---|
| GET | `/users` | Liste des utilisateurs |
| POST | `/users` | Création d'un utilisateur |
| PUT | `/users/:id` | Mise à jour d'un utilisateur |
| DELETE | `/users/:id` | Désactivation d'un utilisateur |

### Tests
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/tests/code/:code` | Public | Récupérer un test via son code d'accès |
| GET | `/tests` | Authentifié | Liste des tests |
| POST | `/tests` | Authentifié | Création d'un test |
| GET | `/tests/:id` | Authentifié | Détail d'un test + ses questions |
| PUT | `/tests/:id` | Authentifié | Mise à jour d'un test |
| DELETE | `/tests/:id` | Authentifié | Désactivation d'un test |

### Questions
| Méthode | Route | Description |
|---|---|---|
| GET | `/tests/:testId/questions` | Liste des questions d'un test |
| POST | `/tests/:testId/questions` | Ajout d'une question |
| PUT | `/tests/:testId/questions/:id` | Mise à jour d'une question |
| DELETE | `/tests/:testId/questions/:id` | Suppression d'une question |

### Sessions (candidat)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/sessions/start` | Public | Démarrer une tentative de test |
| POST | `/sessions/submit` | Public | Soumettre les réponses et obtenir le score |
| GET | `/sessions` | Authentifié | Liste des sessions (candidatures) |
| GET | `/sessions/:id` | Authentifié | Détail d'une session |

### AI
| Méthode | Route | Description |
|---|---|---|
| POST | `/ai/generate-questions` | Génère des questions via Gemini (voir section IA) |

### Reports
| Méthode | Route | Description |
|---|---|---|
| GET | `/reports/dashboard` | Statistiques globales |
| GET | `/reports/export/excel` | Export des résultats au format Excel |
| GET | `/reports/export/pdf` | Export des résultats au format PDF |

---

## 🔒 Sécurité

- **JWT** signé côté serveur (`JWT_SECRET`), transmis via l'en-tête `Authorization: Bearer <token>`
- **bcrypt** pour le hachage des mots de passe (jamais stockés en clair)
- **Middleware d'authentification** (`authMiddleware`) appliqué à toutes les routes sensibles
- **Middleware de rôle** (`adminMiddleware`) restreignant la gestion des comptes utilisateurs aux seuls administrateurs
- **Validation des entrées** sur les champs critiques (mot de passe, formulaires de test/question)
- **CORS** restreint à l'origine définie par `FRONTEND_URL`
- **Aucun secret commité** : les fichiers `.env` sont exclus du dépôt via `.gitignore`, seuls des `.env.example` sont fournis

---

## 🧹 Nettoyage du projet

Dans le cadre de cette mise à niveau, les éléments suivants ont été supprimés du dépôt :

- **`node_modules/`** (backend et frontend) : ne doivent jamais être commités, régénérés via `npm install`
- **`frontend/build/`** : artefact de build, régénéré via `npm run build`
- **Fichiers dupliqués/obsolètes non utilisés par le point d'entrée réel de l'application** :
  - Backend : `src/index.js` et `src/routes/index.js` (ancien point d'entrée jamais chargé par `npm start`/`npm run dev`), ainsi que `src/utils/db.js` et les contrôleurs `usersController.js`, `testsController.js`, `sessionsController.js`, `resultsController.js` — un ensemble cohérent de code mort qui interrogeait un schéma de base de données différent et incompatible avec le schéma réellement utilisé
  - Frontend : `src/utils/AuthContext.js` (deuxième contexte d'authentification en doublon, jamais réellement fourni par un `Provider`), `src/components/admin/Sidebar.js` (composant non importé nulle part), `src/pages/CandidatePage.js`, `src/pages/QuestionsPage.js`, `src/pages/ResultsPage.js`, `src/pages/ResultDetailPage.js` (pages non routées, doublons obsolètes de fonctionnalités déjà couvertes par d'autres pages actives)
  - `frontend/image/` : doublon exact de `frontend/public/image/`, seul ce dernier est servi par l'application
- **`.gitignore` corrigé** : le fichier était encodé en UTF-16, ce qui empêchait Git d'interpréter correctement les règles d'exclusion (c'est notamment ce qui avait permis à `node_modules` de se retrouver commité). Il est désormais en UTF-8 et couvre `node_modules`, les fichiers `.env`, les dossiers de build, les logs et les fichiers d'éditeur/OS
- **Secrets en clair supprimés** : l'ancien `backend/.env` contenait un mot de passe de base de données en clair ; il a été retiré du dépôt et remplacé par des gabarits `.env.example`

### Corrections fonctionnelles associées

- Le schéma `init-db.sql` a été entièrement réécrit : l'ancien script créait des tables en `PascalCase` avec une table `Options` séparée, alors que tous les contrôleurs actifs interrogent des colonnes `snake_case` avec les options stockées en JSON — un projet fraîchement installé avec l'ancien script n'aurait donc jamais fonctionné
- Le bug des deux `AuthContext` concurrents a été corrigé : toute la base de code utilise désormais exclusivement `context/AuthContext.js`, celui réellement fourni par le `AuthProvider` dans `App.js`
- La route `PUT /auth/password` (et son contrôleur associé), utilisée par la page de profil mais absente du routeur, a été ajoutée
- Le composant `App.js` important `<Navigate>` sans l'avoir déclaré a été corrigé

---

## 📦 Déploiement

Chaque service dispose de son propre `Dockerfile` :

```bash
# Backend
cd backend
docker build -t stagedelice-backend .
docker run -p 5000:5000 --env-file .env stagedelice-backend

# Frontend (build statique servi par Nginx)
cd frontend
docker build -t stagedelice-frontend .
docker run -p 80:80 stagedelice-frontend
```

Pour une mise en production complète, il est recommandé de :

1. Provisionner une instance SQL Server managée et exécuter `init-db.sql`
2. Définir des variables d'environnement de production (secrets forts, `NODE_ENV=production`)
3. Servir le frontend derrière un reverse proxy HTTPS (Nginx, déjà fourni, ou un CDN)
4. Configurer `FRONTEND_URL` côté backend pour pointer vers le domaine de production

---

## 🎯 Résultat final

✔ Projet nettoyé (fichiers inutiles, doublons et code mort supprimés)
✔ Schéma de base de données cohérent avec le code applicatif
✔ Bug d'authentification frontend corrigé
✔ Génération de questions par IA opérationnelle de bout en bout (backend + interface)
✔ Sécurité renforcée (secrets exclus du dépôt, contrôle d'accès par rôle resserré)
✔ Documentation complète et à jour
