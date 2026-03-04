const { log } = require('../config/logger');

const errorHandler = async (error, req, res, next) => {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const action = error.action || 'SERVER_ERROR';


  await log("error", action , error.message, req.user?.userId, {
    url: req.originalUrl,
    statusCode,
  });
  res.status(statusCode).json({
    message: error.message || "Erreur serveur",
  });
};

module.exports = errorHandler;
