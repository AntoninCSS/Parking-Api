const jwt = require('jsonwebtoken');
const { log } = require('../config/logger');

const authenticate = async (req, res, next) => {

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token || !authHeader.startsWith('Bearer ')) {
    await log('warn', 'AUTH_NO_TOKEN', 'Requête sans token', null, { url: req.originalUrl });
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch {
    await log('warn', 'INVALID_TOKEN', 'Token invalide ou expiré', null, { url: req.originalUrl });
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
};



const requireRole = (role) => async (req, res, next) => {
  if (req.user.role !== role) {
    await log('warn', 'AUTH_FORBIDDEN', 'Accès refusé, rôle insuffisant', req.user.userId, { url: req.originalUrl });
    return res.status(403).json({ message: "Accès interdit" });
  }
  next();
};

module.exports = { authenticate, requireRole };