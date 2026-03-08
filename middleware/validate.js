const { log } = require('../config/logger');
const xss = require('xss');
const { VALIDATION_FAILED, VALIDATION_INVALID_PARAM } = require('../constants/errors');

// Sanitize récursif — protège contre XSS sur body ET params
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') return xss(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeObject(value)])
    );
  }
  return obj;
};

// app.param() handler — vérifie que c'est un entier positif
// Pas besoin de xss : une chaîne de chiffres purs ne peut pas contenir de XSS
const createParamHandler = (paramName) => (req, res, next, value) => {
  if (!/^\d+$/.test(String(value))) {
    return res.status(400).json({ message: VALIDATION_INVALID_PARAM(paramName) });
  }
  req.params[paramName] = Number(value);
  next();
};

// Validation + sanitize du body
const validate = (schema) => async (req, res, next) => {
  req.body = sanitizeObject(req.body);
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path[0],
      message: err.message,
    }));

    await log('warn', 'VALIDATION_FAILED', 'Validation échouée', null, {
      url: req.originalUrl,
      errors,
    });

    return res.status(400).json({
      status: 'error',
      code: 400,
      message: VALIDATION_FAILED,
      errors,
    });
  }

  req.body = result.data;
  next();
};


//Appel dans le app.js pour check les params 
const parkingIdParam = createParamHandler('parkingId');
const reservationIdParam = createParamHandler('reservationId');

module.exports = { validate, parkingIdParam, reservationIdParam };