# Parking API

API REST pour gérer les parkings avec Node.js, Express et PostgreSQL.

## Installation

```bash
npm install
```

## Configuration

Crée un fichier `.env` :

```env
DB_HOST=localhost
DB_USER=db_user
DB_PASSWORD=password
DB_PORT=1234
DB_NAME=Db-Name
PORT=1234
```

## Base de données

```bash
psql -U postgres

CREATE DATABASE parking_db;
\c parking_db

CREATE TABLE parkings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Démarrer

```bash
npm start
```

## Documentation

Swagger UI : `http://localhost:3446/api-docs`

## Routes

- `GET /parkings` - Tous les parkings
- `GET /parkings/:id` - Un parking
- `POST /parkings` - Créer
- `PUT /parkings/:id` - Modifier
- `DELETE /parkings/:id` - Supprimer