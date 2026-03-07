const con = require('../config/db.js');
const { log } = require('../config/logger');

function convertToISO(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`).toISOString();
}

exports.getAllReservations = async (parkingId, { page, limit, offset }) => {
  const total = await con.query(
    'SELECT COUNT(*) FROM reservations WHERE parking_id = $1',
    [parkingId]
  );
  const totalCount = parseInt(total.rows[0].count);

  const result = await con.query(
    'SELECT * FROM reservations WHERE parking_id = $1 ORDER BY id LIMIT $2 OFFSET $3',
    [parkingId, limit, offset]
  );

  return {
    data: result.rows,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

exports.getReservationById = async (parkingId, reservationId) => {
  const result = await con.query(
    'SELECT * FROM reservations WHERE id = $1 AND parking_id = $2',
    [reservationId, parkingId]
  );

  if (result.rows.length === 0) {
    await log('warn', 'RESERVATION_NOT_FOUND', 'Réservation introuvable', null, { parkingId, reservationId });
    const error = new Error('Réservation introuvable');
    error.statusCode = 404;
    throw error;
  }

  return result.rows;
};

exports.createReservation = async (parkingId, body, userId) => {
  let { client_name, vehicle, license_plate, checkin, checkout } = body;
  checkin = convertToISO(checkin);
  checkout = convertToISO(checkout);

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);

  if (checkinDate > checkoutDate) {
    await log('warn', 'RESERVATION_INVALID_DATES', 'Date de check-in après check-out', userId, { parkingId, checkin, checkout });
    const error = new Error('La date de check-in doit être avant la date de check-out');
    error.statusCode = 400;
    throw error;
  }

  const result = await con.query(
    'INSERT INTO reservations (parking_id, client_name, vehicle, license_plate, checkin, checkout) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [parkingId, client_name, vehicle, license_plate, checkin, checkout]
  );

  await log('info', 'RESERVATION_CREATED', 'Réservation créée', userId, { parkingId, reservationId: result.rows[0].id });
  return result.rows;
};

exports.updateReservation = async (parkingId, reservationId, body, userId) => {
  const requiredFields = ['client_name', 'vehicle', 'license_plate', 'checkin', 'checkout'];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    await log('warn', 'RESERVATION_MISSING_FIELDS', 'Champs manquants', userId, { missingFields });
    const error = new Error(`Champs manquants : ${missingFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  let { client_name, vehicle, license_plate, checkin, checkout } = body;
  checkin = convertToISO(checkin);
  checkout = convertToISO(checkout);

  if (new Date(checkin) > new Date(checkout)) {
    await log('warn', 'RESERVATION_INVALID_DATES', 'Date de check-in après check-out', userId, { parkingId, reservationId });
    const error = new Error('La date de check-in doit être avant la date de check-out');
    error.statusCode = 400;
    throw error;
  }

  const result = await con.query(
    'UPDATE reservations SET parking_id = $1, client_name = $2, vehicle = $3, license_plate = $4, checkin = $5, checkout = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
    [parkingId, client_name, vehicle, license_plate, checkin, checkout, reservationId]
  );

  if (result.rows.length === 0) {
    await log('warn', 'RESERVATION_NOT_FOUND', 'Réservation introuvable', userId, { parkingId, reservationId });
    const error = new Error('Réservation introuvable');
    error.statusCode = 404;
    throw error;
  }

  await log('info', 'RESERVATION_UPDATED', 'Réservation mise à jour', userId, { parkingId, reservationId: result.rows[0].id });
  return result.rows;
};

exports.deleteReservation = async (parkingId, reservationId, userId) => {
  const result = await con.query(
    'DELETE FROM reservations WHERE id = $1 AND parking_id = $2 RETURNING *',
    [reservationId, parkingId]
  );

  if (result.rows.length === 0) {
    await log('warn', 'RESERVATION_NOT_FOUND', 'Réservation introuvable', null, { parkingId, reservationId });
    const error = new Error('Réservation introuvable');
    error.statusCode = 404;
    throw error;
  }

  await log('info', 'RESERVATION_DELETED', 'Réservation supprimée', userId, { parkingId, reservationId });
  return result.rows;
};

exports.updatePartialReservation = async (parkingId, reservationId, updates, userId) => {
  const allowedFields = ['client_name', 'vehicle', 'license_plate', 'checkin', 'checkout'];
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = $${paramIndex}`);
      values.push(updates[field]);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    await log('warn', 'RESERVATION_NO_FIELDS', 'Aucun champ à modifier', userId);
    const error = new Error('Aucun champ à modifier');
    error.statusCode = 400;
    throw error;
  }

  values.push(reservationId);
  values.push(parkingId);

  const sql = `
    UPDATE reservations
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex} AND parking_id = $${paramIndex + 1}
    RETURNING *
  `;
  const result = await con.query(sql, values);

  if (result.rows.length === 0) {
    await log('warn', 'RESERVATION_NOT_FOUND', 'Réservation introuvable', userId, { parkingId, reservationId });
    const error = new Error('Réservation introuvable');
    error.statusCode = 404;
    throw error;
  }

  await log('info', 'RESERVATION_PARTIALLY_UPDATED', 'Réservation partiellement mise à jour', userId, { parkingId, reservationId: result.rows[0].id });
  return result.rows[0];
};
