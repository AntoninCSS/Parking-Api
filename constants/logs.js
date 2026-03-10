// ─── Auth ─────────────────────────────────────────────────────────────────────
const LOG_USER_REGISTER        = { action: 'USER_REGISTER',        message: 'Nouvel utilisateur créé' };
const LOG_USER_REGISTER_FAILED = { action: 'USER_REGISTER_FAILED', message: 'Email déjà utilisé' };
const LOG_USER_LOGIN           = { action: 'USER_LOGIN',           message: 'Connexion réussie' };
const LOG_USER_LOGIN_FAILED    = { action: 'USER_LOGIN_FAILED',    message: 'Identifiants invalides' };

// ─── Parking ──────────────────────────────────────────────────────────────────
const LOG_PARKING_CREATED           = { action: 'PARKING_CREATED',           message: 'Parking créé' };
const LOG_PARKING_UPDATED           = { action: 'PARKING_UPDATED',           message: 'Parking modifié' };
const LOG_PARKING_DELETED           = { action: 'PARKING_DELETED',           message: 'Parking supprimé' };
const LOG_PARKING_PARTIALLY_UPDATED = { action: 'PARKING_PARTIALLY_UPDATED', message: 'Parking partiellement modifié' };

// ─── Reservation ──────────────────────────────────────────────────────────────
const LOG_RESERVATION_NOT_FOUND          = { action: 'RESERVATION_NOT_FOUND',          message: 'Réservation introuvable' };
const LOG_RESERVATION_INVALID_DATES      = { action: 'RESERVATION_INVALID_DATES',      message: 'Date de check-in après check-out' };
const LOG_RESERVATION_MISSING_FIELDS     = { action: 'RESERVATION_MISSING_FIELDS',     message: 'Champs manquants' };
const LOG_RESERVATION_NO_FIELDS          = { action: 'RESERVATION_NO_FIELDS',          message: 'Aucun champ à modifier' };
const LOG_RESERVATION_CREATED            = { action: 'RESERVATION_CREATED',            message: 'Réservation créée' };
const LOG_RESERVATION_UPDATED            = { action: 'RESERVATION_UPDATED',            message: 'Réservation mise à jour' };
const LOG_RESERVATION_DELETED            = { action: 'RESERVATION_DELETED',            message: 'Réservation supprimée' };
const LOG_RESERVATION_PARTIALLY_UPDATED  = { action: 'RESERVATION_PARTIALLY_UPDATED',  message: 'Réservation partiellement mise à jour' };

module.exports = {
  LOG_USER_REGISTER,
  LOG_USER_REGISTER_FAILED,
  LOG_USER_LOGIN,
  LOG_USER_LOGIN_FAILED,
  LOG_PARKING_CREATED,
  LOG_PARKING_UPDATED,
  LOG_PARKING_DELETED,
  LOG_PARKING_PARTIALLY_UPDATED,
  LOG_RESERVATION_NOT_FOUND,
  LOG_RESERVATION_INVALID_DATES,
  LOG_RESERVATION_MISSING_FIELDS,
  LOG_RESERVATION_NO_FIELDS,
  LOG_RESERVATION_CREATED,
  LOG_RESERVATION_UPDATED,
  LOG_RESERVATION_DELETED,
  LOG_RESERVATION_PARTIALLY_UPDATED,
};
