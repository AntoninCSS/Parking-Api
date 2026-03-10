# 🅿️ Parking API

API REST de gestion de parkings et réservations, construite avec Node.js, Express, PostgreSQL et Prisma ORM.

---

## 📦 Stack technique

| Catégorie | Technologie |
|---|---|
| **Runtime** | Node.js v22 |
| **Framework** | Express.js v5 |
| **ORM** | Prisma v6 |
| **Base de données** | PostgreSQL 16 |
| **Authentification** | JWT + bcryptjs |
| **Validation** | Zod |
| **Sécurité** | Helmet, CORS, Rate Limiting, XSS sanitization, HPP |
| **Logs** | Winston + Morgan |
| **Documentation** | Swagger (swagger-jsdoc + swagger-ui-express) |
| **Tests** | Jest + Supertest |
| **Linting** | ESLint |

---

## 🐳 Démarrage rapide avec Docker

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/) installés

### Lancer le projet

```bash
git clone https://github.com/AntoninCSS/Parking-Api.git
cd Parking-Api
cp .env.example .env
docker compose up -d
```

L'API est accessible sur `http://localhost:3446`

### Arrêter le projet

```bash
docker compose down
```

### Arrêter et supprimer les données

```bash
docker compose down -v
```

---

## 💻 Installation locale (sans Docker)

### Prérequis

- Node.js v22+
- npm v10+
- PostgreSQL 16+

### Installation

```bash
git clone https://github.com/AntoninCSS/Parking-Api.git
cd Parking-Api
npm install
```

Crée un fichier `.env` à la racine :

```env
PORT=3446
DATABASE_URL="postgresql://postgres:password@localhost:5433/Parking?schema=public"
JWT_SECRET=une_chaine_longue_et_aleatoire
```

Applique les migrations Prisma :

```bash
npx prisma migrate deploy
npx prisma generate
```

Lance le serveur :

```bash
npm run dev
```

---

## 📁 Structure du projet

```
Parking-Api/
├── config/
│   ├── db.js                     # Connexion PostgreSQL (legacy)
│   └── prisma.js                 # Client Prisma ORM
├── constants/
│   ├── errors.js                 # Messages d'erreurs centralisés
│   └── logs.js                   # Actions de logs centralisées
├── controllers/
│   ├── authController.js         # Register / Login
│   ├── parkingController.js      # CRUD Parkings
│   └── reservationController.js  # CRUD Réservations
├── middleware/
│   ├── errorHandler.js           # Gestion centralisée des erreurs
│   ├── authMiddleware.js         # Vérification token JWT
│   └── validate.js               # Validation Zod + sanitization XSS
├── prisma/
│   ├── schema.prisma             # Schéma de la base de données
│   └── migrations/               # Historique des migrations
├── routes/
│   ├── authRoutes.js             # /auth
│   ├── parkingRoutes.js          # /parkings
│   └── reservationRoutes.js      # /parkings/:parkingId/reservations
├── services/
│   ├── authService.js            # Logique métier authentification
│   ├── parkingService.js         # Logique métier parkings
│   └── reservationService.js     # Logique métier réservations
├── __tests__/
│   ├── integration/              # Tests d'intégration (Supertest)
│   └── unit/                     # Tests unitaires (Jest)
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── app.js
├── server.js
└── README.md
```

---

## 🔌 Routes API

### Authentification

| Méthode | Route | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Créer un compte | ❌ |
| POST | `/auth/login` | Se connecter | ❌ |

### Parkings

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/parkings` | Liste paginée | ✅ |
| GET | `/parkings/:id` | Détail d'un parking | ✅ |
| POST | `/parkings` | Créer un parking | ✅ |
| PUT | `/parkings/:id` | Modifier un parking | ✅ |
| PATCH | `/parkings/:id` | Modification partielle | ✅ |
| DELETE | `/parkings/:id` | Supprimer un parking | ✅ Admin |

### Réservations

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/parkings/:parkingId/reservations` | Liste des réservations | ✅ |
| GET | `/parkings/:parkingId/reservations/:id` | Détail d'une réservation | ✅ |
| POST | `/parkings/:parkingId/reservations` | Créer une réservation | ✅ |
| PUT | `/parkings/:parkingId/reservations/:id` | Modifier une réservation | ✅ |
| PATCH | `/parkings/:parkingId/reservations/:id` | Modification partielle | ✅ |
| DELETE | `/parkings/:parkingId/reservations/:id` | Supprimer une réservation | ✅ Admin |

---

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

---

## 📖 Documentation Swagger

Accessible à l'URL :

```
http://localhost:3446/api-docs
```

---

## 🗄️ Base de données (Prisma Schema)

### Table `parkings`

| Colonne | Type | Description |
|---|---|---|
| id | Int (autoincrement) | Identifiant unique |
| name | String | Nom du parking |
| city | String | Ville |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

### Table `reservations`

| Colonne | Type | Description |
|---|---|---|
| id | Int (autoincrement) | Identifiant unique |
| parking_id | Int (FK → parkings) | Référence au parking |
| client_name | String | Nom du client |
| vehicle | String | Type de véhicule |
| license_plate | String | Plaque d'immatriculation |
| checkin | DateTime | Date d'arrivée |
| checkout | DateTime | Date de départ |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

### Table `users`

| Colonne | Type | Description |
|---|---|---|
| id | Int (autoincrement) | Identifiant unique |
| email | String (unique) | Email |
| password_hash | String | Mot de passe hashé (bcrypt) |
| role | String (default: "user") | user / admin |
| created_at | DateTime | Date de création |

### Table `logs`

| Colonne | Type | Description |
|---|---|---|
| id | Int (autoincrement) | Identifiant unique |
| level | String | Niveau (info, warn, error) |
| action | String | Action effectuée |
| message | String | Description |
| user_id | Int | Utilisateur concerné |
| meta | Json | Données supplémentaires |
| created_at | DateTime | Date de création |

---

## 🔑 Authentification

Les routes protégées nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

Obtenir un token :

```bash
curl -X POST http://localhost:3446/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"monpassword123"}'
```

---

## 🏗️ Architecture

Le projet suit une architecture **MVC + Service Layer** :

- **Controller** → Gère la requête HTTP (params, réponse, status codes)
- **Service** → Contient la logique métier et les appels Prisma
- **Middleware** → Validation, authentification, sécurité
- **Constants** → Messages d'erreurs et actions de logs centralisés

---

## 🔒 Sécurité

- **Helmet** : Headers HTTP sécurisés
- **Rate Limiting** : Limite le nombre de requêtes par IP
- **XSS Sanitization** : Nettoyage récursif des inputs
- **Zod Validation** : Validation stricte des données entrantes
- **bcrypt** : Hashage des mots de passe (salt rounds: 10)
- **JWT** : Tokens d'authentification (expiration: 2h)
- **RBAC** : Contrôle d'accès basé sur les rôles (user/admin)

---

## 📝 Scripts disponibles

| Script | Commande | Description |
|---|---|---|
| `dev` | `npm run dev` | Serveur en mode développement (nodemon) |
| `test` | `npm test` | Lance les tests Jest |
| `test:watch` | `npm run test:watch` | Tests en mode watch |
| `test:coverage` | `npm run test:coverage` | Tests avec couverture de code |
