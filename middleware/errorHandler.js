const { Prisma } = require('@prisma/client');
const { log } = require('../config/logger');
const { SERVER_ERROR } = require('../constants/errors');

// eslint-disable-next-line no-unused-vars
const errorHandler = async (error, req, res, next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Ressource introuvable' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ressource déjà existante' });
    }
  }

  const statusCode = error.statusCode || 500;
  const action = error.action || 'SERVER_ERROR';

  await log("error", action, error.message, req.user?.userId, {
    url: req.originalUrl,
    statusCode,
  });
  res.status(statusCode).json({
    message: error.message || SERVER_ERROR,
  });
};

module.exports = errorHandler;
