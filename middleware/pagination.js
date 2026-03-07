const MAX_LIMIT = 100;

const sanitizePositiveInt = (value, defaultValue) => {
  if (value === undefined || value === null) return defaultValue;
  // Rejette tout ce qui n'est pas un entier positif pur (bloque XSS, injections, floats, négatifs)
  if (!/^\d+$/.test(String(value))) return defaultValue;
  const parsed = parseInt(value, 10);
  return parsed > 0 ? parsed : defaultValue;
};

const paginate = (req, res, next) => {
  const page = sanitizePositiveInt(req.query.page, 1);
  const limit = Math.min(sanitizePositiveInt(req.query.limit, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };
  next();
};

module.exports = { paginate };