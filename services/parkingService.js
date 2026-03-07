const con = require('../config/db.js');
const { log } = require('../config/logger');

exports.getAllParkings = async ({ page, limit, offset }) => {
  const total = await con.query('SELECT COUNT(*) FROM parkings');
  const totalCount = parseInt(total.rows[0].count);

  const result = await con.query(
    'SELECT * FROM parkings ORDER BY id LIMIT $1 OFFSET $2',
    [limit, offset]
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

exports.getParkingById = async (id) => {
  const result = await con.query('SELECT * FROM parkings WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    await log('warn', 'PARKING_NOT_FOUND', 'Parking introuvable', null, { parkingId: id });
    const error = new Error('Parking introuvable');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

exports.createParking = async (name, city, userId) => {
  if (!name || !city) {
    const error = new Error('Nom et ville requis');
    error.statusCode = 400;
    throw error;
  }

  const result = await con.query(
    'INSERT INTO parkings (name, city) VALUES ($1, $2) RETURNING *',
    [name, city]
  );

  await log('info', 'PARKING_CREATED', 'Parking créé', userId, { parkingId: result.rows[0].id });
  return result.rows[0];
};

exports.updateParking = async (id, name, city, userId) => {
  if (!name || !city) {
    const error = new Error('Nom et ville requis');
    error.statusCode = 400;
    throw error;
  }

  const result = await con.query(
    'UPDATE parkings SET name = $1, city = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [name, city, id]
  );

  if (result.rows.length === 0) {
    const error = new Error('Parking introuvable');
    error.statusCode = 404;
    throw error;
  }

  await log('info', 'PARKING_UPDATED', 'Parking modifié', userId, { parkingId: result.rows[0].id });
  return result.rows[0];
};

exports.deleteParking = async (id, userId) => {
  const result = await con.query(
    'DELETE FROM parkings WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error('Parking introuvable');
    error.statusCode = 404;
    throw error;
  }

  await log('info', 'PARKING_DELETED', 'Parking supprimé', userId, { parkingId: result.rows[0].id });
  return result.rows[0];
};

exports.updatePartialParking = async (id, updates, userId) => {
  const allowedFields = ['name', 'city', 'type'];
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
    const error = new Error('Aucun champ à modifier');
    error.statusCode = 400;
    throw error;
  }

  values.push(id);
  const sql = `UPDATE parkings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
  const result = await con.query(sql, values);

  if (result.rows.length === 0) {
    const error = new Error('Parking introuvable');
    error.statusCode = 404;
    throw error;
  }

  await log('info', 'PARKING_PARTIALLY_UPDATED', 'Parking modifié', userId, { parkingId: result.rows[0].id });
  return result.rows[0];
}; 