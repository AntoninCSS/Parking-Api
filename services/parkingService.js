const { log } = require("../config/logger");
const {
  LOG_PARKING_CREATED,
  LOG_PARKING_UPDATED,
  LOG_PARKING_DELETED,
  LOG_PARKING_PARTIALLY_UPDATED,
} = require("../constants/logs");
const prisma = require("../config/prisma");
const {
  PARKING_NOT_FOUND,
  PARKING_NAME_CITY_REQUIRED,
  NO_FIELD_TO_UPDATE,
} = require("../constants/errors");

exports.getAllParkings = async ({ page, limit, offset }) => {
  const [parkings, total] = await prisma.$transaction([
    prisma.parkings.findMany({
      orderBy: { id: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.parkings.count(),
  ]);

  return {
    data: parkings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getParkingById = async (id) => {
  const parking = await prisma.parkings.findUnique({
    where: { id: parseInt(id) },
  });
  if (!parking) {
    const error = new Error(PARKING_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }
  return parking;
};

exports.createParking = async (name, city, userId) => {
  if (!name || !city) {
    const error = new Error(PARKING_NAME_CITY_REQUIRED);
    error.statusCode = 400;
    throw error;
  }
  const parking = await prisma.parkings.create({
    data: { name, city },
  });

  await log(
    "info",
    LOG_PARKING_CREATED.action,
    LOG_PARKING_CREATED.message,
    userId,
    {
      parkingId: parking.id,
    },
  );
  return parking;
};

exports.updateParking = async (id, name, city, userId) => {
  if (!name || !city) {
    const error = new Error(PARKING_NAME_CITY_REQUIRED);
    error.statusCode = 400;
    throw error;
  }

  const parking = await prisma.parkings.update({
    where: { id: parseInt(id) },
    data: { name, city },
  });

  await log(
    "info",
    LOG_PARKING_UPDATED.action,
    LOG_PARKING_UPDATED.message,
    userId,
    {
      parkingId: parking.id,
    },
  );
  return parking;
};

exports.deleteParking = async (id, userId) => {
  const parking = await prisma.parkings.delete({
    where: { id: parseInt(id) },
  });

  await log(
    "info",
    LOG_PARKING_DELETED.action,
    LOG_PARKING_DELETED.message,
    userId,
    {
      parkingId: parking.id,
    },
  );
  return parking;
};

exports.updatePartialParking = async (id, updates, userId) => {
  const allowedFields = ["name", "city"];
  const data = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  if (Object.keys(data).length === 0) {
    const error = new Error(NO_FIELD_TO_UPDATE);
    error.statusCode = 400;
    throw error;
  }

  const parking = await prisma.parkings.update({
    where: { id: parseInt(id) },
    data,
  });

  await log(
    "info",
    LOG_PARKING_PARTIALLY_UPDATED.action,
    LOG_PARKING_PARTIALLY_UPDATED.message,
    userId,
    {
      parkingId: parking.id,
    },
  );

  return parking;
};
