// ─── Auth ─────────────────────────────────────────────────────────────────────
const AUTH_TOKEN_MISSING          = 'Token manquant';
const AUTH_TOKEN_INVALID          = 'Token invalide ou expiré';
const AUTH_FORBIDDEN              = 'Accès interdit';
const AUTH_CREDENTIALS_REQUIRED   = 'Email et mot de passe requis';
const AUTH_PASSWORD_TOO_SHORT     = 'Mot de passe trop court (12 caractères minimum)';
const AUTH_EMAIL_ALREADY_USED     = 'Email déjà utilisé';
const AUTH_INVALID_CREDENTIALS    = 'Identifiants invalides';

// ─── Validation ───────────────────────────────────────────────────────────────
const VALIDATION_FAILED           = 'Validation échouée';
const VALIDATION_INVALID_PARAM    = (paramName) => `Paramètre invalide : ${paramName}`;

// ─── Parking ──────────────────────────────────────────────────────────────────
const PARKING_NOT_FOUND           = 'Parking introuvable';
const PARKING_NAME_CITY_REQUIRED  = 'Nom et ville requis';

// ─── Reservation ──────────────────────────────────────────────────────────────
const RESERVATION_NOT_FOUND       = 'Réservation introuvable';
const RESERVATION_INVALID_DATES   = 'La date de check-in doit être avant la date de check-out';
const RESERVATION_MISSING_FIELDS  = (fields) => `Champs manquants : ${fields}`;

// ─── Générique ────────────────────────────────────────────────────────────────
const NO_FIELD_TO_UPDATE          = 'Aucun champ à modifier';
const SERVER_ERROR                = 'Erreur serveur';

const AUTH_REFRESH_TOKEN_MISSING  = 'Refresh token manquant';
const AUTH_REFRESH_TOKEN_INVALID  = 'Refresh token invalide ou expiré';
const AUTH_REFRESH_TOKEN_REVOKED  = 'Refresh token révoqué';

module.exports = {
  AUTH_TOKEN_MISSING,
  AUTH_TOKEN_INVALID,
  AUTH_FORBIDDEN,
  AUTH_CREDENTIALS_REQUIRED,
  AUTH_PASSWORD_TOO_SHORT,
  AUTH_EMAIL_ALREADY_USED,
  AUTH_INVALID_CREDENTIALS,
  VALIDATION_FAILED,
  VALIDATION_INVALID_PARAM,
  PARKING_NOT_FOUND,
  AUTH_REFRESH_TOKEN_INVALID,
  AUTH_REFRESH_TOKEN_MISSING,
  AUTH_REFRESH_TOKEN_REVOKED,
  PARKING_NAME_CITY_REQUIRED,
  RESERVATION_NOT_FOUND,
  RESERVATION_INVALID_DATES,
  RESERVATION_MISSING_FIELDS,
  NO_FIELD_TO_UPDATE,
  SERVER_ERROR,
};
