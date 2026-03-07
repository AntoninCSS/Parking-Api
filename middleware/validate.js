const { log } = require('../config/logger');
const xss = require('xss');

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

// app.param() handler — sanitize XSS + vérifie que c'est un entier positif
const createParamHandler = (paramName) => (req, res, next, value) => {
  const sanitized = xss(String(value));
  if (!/^\d+$/.test(sanitized)) {
    return res.status(400).json({ message: `Paramètre invalide : ${paramName}` });
  }
  req.params[paramName] = Number(sanitized);
  next();
};

const parkingIdParam = createParamHandler('parkingId');
const reservationIdParam = createParamHandler('reservationId');

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
      message: 'Validation échouée',
      errors,
    });
  }

  req.body = result.data;
  next();
};


module.exports = { validate, parkingIdParam, reservationIdParam };