# 🅿️ Parking API

API REST de gestion de parkings et réservations, construite avec Node.js, Express et PostgreSQL.

---

## 📦 Stack technique

- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** : PostgreSQL
- **Authentification** : JWT (jsonwebtoken) + bcryptjs
- **Documentation** : Swagger (swagger-jsdoc + swagger-ui-express)

---

## 🚀 Installation

```bash
git clone <repo>
cd first-api
npm install
```

Crée un fichier `.env` à la racine :

```env
PORT=3446
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking
DB_USER=postgres
DB_PASSWORD=ton_password
JWT_SECRET=une_chaine_longue_et_aleatoire
```

Lance le serveur :

```bash
npm run dev
```

---

## 📁 Structure du projet

```
first-api/
├── config/
│   └── db.js                     # Connexion PostgreSQL
├── controllers/
│   ├── authController.js         # Register / Login
│   ├── parkingController.js      # CRUD Parkings
│   └── reservationController.js  # CRUD Réservations
├── middleware/
│   ├── errorHandler.js           # Gestion Des erreurs
│   └── authMiddleware.js         # Vérification token JWT
├── routes/
│   ├── authRoutes.js             # /auth
│   ├── parkingRoutes.js          # /parkings
│   └── reservationRoutes.js      # /parkings/:parkingId/reservations
├── .env
├── app.js
└── README.md
```

---

## 🔄 Changements récents

### ♻️ Restructuration des routes `/reservations`

**Avant :**
```
GET    /reservations
GET    /reservations/:id
POST   /reservations
PUT    /reservations/:id
PATCH  /reservations/:id
DELETE /reservations/:id
```

**Après :**
```
GET    /parkings/:parkingId/reservations
GET    /parkings/:parkingId/reservations/:id
POST   /parkings/:parkingId/reservations
PUT    /parkings/:parkingId/reservations/:id
PATCH  /parkings/:parkingId/reservations/:id
DELETE /parkings/:parkingId/reservations/:id
```

### 🔐 Ajout de l'authentification JWT

Mise en place d'un système d'authentification complet par token JWT.

**Nouvelles routes :**
```
POST /auth/register   → Créer un compte
POST /auth/login      → Se connecter, recevoir un token
```

**Nouveau middleware :**
Le middleware `authMiddleware.js` intercepte les requêtes sur les routes protégées, vérifie la validité du token JWT présent dans le header `Authorization`, et injecte les informations utilisateur dans `req.user`.

**Nouvelle table en base de données :**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fonctionnement :**
1. L'utilisateur s'inscrit via `/auth/register`, le mot de passe est hashé avec bcrypt avant stockage
2. L'utilisateur se connecte via `/auth/login`, le serveur retourne un token JWT valable 2h
3. Le client joint ce token dans le header de chaque requête protégée :
   ```
   Authorization: Bearer <token>
   ```

---

## 📖 Documentation Swagger

Accessible à l'URL :
```
http://localhost:3446/api-docs
```

---

## 🗄️ Base de données

### Table `parkings`
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant unique |
| name | VARCHAR | Nom du parking |
| city | VARCHAR | Ville |
| type | VARCHAR | indoor / outdoor |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de modification |

### Table `reservations`
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant unique |
| parking_id | INTEGER | Référence au parking (FK) |
| client_name | VARCHAR | Nom du client |
| vehicle | VARCHAR | Type de véhicule |
| license_plate | VARCHAR | Plaque d'immatriculation |
| checkin | TIMESTAMP | Date d'arrivée |
| checkout | TIMESTAMP | Date de départ |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de modification |

### Table `users`
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant unique |
| email | VARCHAR | Email (unique) |
| password_hash | VARCHAR | Mot de passe hashé (bcrypt) |
| role | VARCHAR | user / admin (défaut: user) |
| created_at | TIMESTAMP | Date de création |

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