# Parking API

Une API Node.js/Express pour gérer les parkings avec PostgreSQL.

## Installation
```bash
npm install
```

## Variables d'environnement

Crée un fichier `.env` :
```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_PORT=5433
DB_NAME=parking_db
PORT=3446
```

## Démarrer
```bash
npm start
```

ou pour le développement :
```bash
npm run dev
```

## Routes

- GET /parkings
- GET /parkings/:id
- POST /parkings
- PUT /parkings/:id
- DELETE /parkings/:id
