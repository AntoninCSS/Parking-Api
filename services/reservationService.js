const prisma = require('../config/prisma.js');
const { log } = require('../config/logger');
const {
  RESERVATION_NOT_FOUND,
  RESERVATION_INVALID_DATES,
  RESERVATION_MISSING_FIELDS,
  NO_FIELD_TO_UPDATE,
} = require('../constants/errors');
const {
  LOG_RESERVATION_NOT_FOUND,
  LOG_RESERVATION_INVALID_DATES,
  LOG_RESERVATION_MISSING_FIELDS,
  LOG_RESERVATION_NO_FIELDS,
  LOG_RESERVATION_CREATED,
  LOG_RESERVATION_UPDATED,
  LOG_RESERVATION_DELETED,
  LOG_RESERVATION_PARTIALLY_UPDATED,
} = require('../constants/logs');

const reservationSelect = {
  id: true,
  parking_id: true,
  client_name: true,
  vehicle: true,
  license_plate: true,
  checkin: true,
  checkout: true,
};

function convertToISO(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`).toISOString();
}

exports.getAllReservations = async (parkingId, { page, limit, offset }) => {
  parkingId = parseInt(parkingId);
  const [totalCount, rows] = await Promise.all([
    prisma.reservations.count({ where: { parking_id: parkingId } }),
    prisma.reservations.findMany({
      where: { parking_id: parkingId },
      orderBy: { id: 'asc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    data: rows,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

exports.getReservationById = async (parkingId, reservationId) => {
  parkingId = parseInt(parkingId);
  reservationId = parseInt(reservationId);

  const reservation = await prisma.reservations.findFirst({
    where: { id: reservationId, parking_id: parkingId },
  });

  if (!reservation) {
    await log('warn', LOG_RESERVATION_NOT_FOUND.action, LOG_RESERVATION_NOT_FOUND.message, null, { parkingId, reservationId });
    const error = new Error(RESERVATION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return [reservation];
};

exports.createReservation = async (parkingId, body, userId) => {
  parkingId = parseInt(parkingId);

  let { client_name, vehicle, license_plate, checkin, checkout } = body;
  checkin = convertToISO(checkin);
  checkout = convertToISO(checkout);

  if (new Date(checkin) > new Date(checkout)) {
    await log('warn', LOG_RESERVATION_INVALID_DATES.action, LOG_RESERVATION_INVALID_DATES.message, userId, { parkingId, checkin, checkout });
    const error = new Error(RESERVATION_INVALID_DATES);
    error.statusCode = 400;
    throw error;
  }

  const reservation = await prisma.reservations.create({
    data: {
      parking_id: parkingId,
      client_name,
      vehicle,
      license_plate,
      checkin: new Date(checkin),
      checkout: new Date(checkout),
    },
    select: reservationSelect,
  });

  await log('info', LOG_RESERVATION_CREATED.action, LOG_RESERVATION_CREATED.message, userId, { parkingId, reservationId: reservation.id });
  return [reservation];
};

exports.updateReservation = async (parkingId, reservationId, body, userId) => {
  parkingId = parseInt(parkingId);
  reservationId = parseInt(reservationId);

  const requiredFields = ['client_name', 'vehicle', 'license_plate', 'checkin', 'checkout'];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    await log('warn', LOG_RESERVATION_MISSING_FIELDS.action, LOG_RESERVATION_MISSING_FIELDS.message, userId, { missingFields });
    const error = new Error(RESERVATION_MISSING_FIELDS(missingFields.join(', ')));
    error.statusCode = 400;
    throw error;
  }

  let { client_name, vehicle, license_plate, checkin, checkout } = body;
  checkin = convertToISO(checkin);
  checkout = convertToISO(checkout);

  if (new Date(checkin) > new Date(checkout)) {
    await log('warn', LOG_RESERVATION_INVALID_DATES.action, LOG_RESERVATION_INVALID_DATES.message, userId, { parkingId, reservationId });
    const error = new Error(RESERVATION_INVALID_DATES);
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.reservations.findFirst({
    where: { id: reservationId, parking_id: parkingId },
  });

  if (!existing) {
    await log('warn', LOG_RESERVATION_NOT_FOUND.action, LOG_RESERVATION_NOT_FOUND.message, userId, { parkingId, reservationId });
    const error = new Error(RESERVATION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  const reservation = await prisma.reservations.update({
    where: { id: reservationId },
    data: {
      parking_id: parkingId,
      client_name,
      vehicle,
      license_plate,
      checkin: new Date(checkin),
      checkout: new Date(checkout),
      updated_at: new Date(),
    },
  });

  await log('info', LOG_RESERVATION_UPDATED.action, LOG_RESERVATION_UPDATED.message, userId, { parkingId, reservationId: reservation.id });
  return [reservation];
};

exports.deleteReservation = async (parkingId, reservationId, userId) => {
  parkingId = parseInt(parkingId);
  reservationId = parseInt(reservationId);

  const existing = await prisma.reservations.findFirst({
    where: { id: reservationId, parking_id: parkingId },
  });

  if (!existing) {
    await log('warn', LOG_RESERVATION_NOT_FOUND.action, LOG_RESERVATION_NOT_FOUND.message, null, { parkingId, reservationId });
    const error = new Error(RESERVATION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  await prisma.reservations.delete({ where: { id: reservationId } });

  await log('info', LOG_RESERVATION_DELETED.action, LOG_RESERVATION_DELETED.message, userId, { parkingId, reservationId });
  return [existing];
};

exports.updatePartialReservation = async (parkingId, reservationId, updates, userId) => {
  parkingId = parseInt(parkingId);
  reservationId = parseInt(reservationId);

  const allowedFields = ['client_name', 'vehicle', 'license_plate', 'checkin', 'checkout'];
  const data = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = (field === 'checkin' || field === 'checkout')
        ? new Date(convertToISO(updates[field]))
        : updates[field];
    }
  }

  if (Object.keys(data).length === 0) {
    await log('warn', LOG_RESERVATION_NO_FIELDS.action, LOG_RESERVATION_NO_FIELDS.message, userId);
    const error = new Error(NO_FIELD_TO_UPDATE);
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.reservations.findFirst({
    where: { id: reservationId, parking_id: parkingId },
  });

  if (!existing) {
    await log('warn', LOG_RESERVATION_NOT_FOUND.action, LOG_RESERVATION_NOT_FOUND.message, userId, { parkingId, reservationId });
    const error = new Error(RESERVATION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  const reservation = await prisma.reservations.update({
    where: { id: reservationId },
    data: { ...data, updated_at: new Date() },
  });

  await log('info', LOG_RESERVATION_PARTIALLY_UPDATED.action, LOG_RESERVATION_PARTIALLY_UPDATED.message, userId, { parkingId, reservationId: reservation.id });
  return reservation;
};
