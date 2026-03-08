const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const con = require('../config/db.js');
const { log } = require('../config/logger');
const {
  AUTH_CREDENTIALS_REQUIRED,
  AUTH_PASSWORD_TOO_SHORT,
  AUTH_EMAIL_ALREADY_USED,
  AUTH_INVALID_CREDENTIALS,
} = require('../constants/errors');

exports.registerUser = async (email, password) => {
  // Validation
  if (!email || !password) {
    const error = new Error(AUTH_CREDENTIALS_REQUIRED);
    error.statusCode = 400;
    throw error;
  }
  if (password.length < 12) {
    const error = new Error(AUTH_PASSWORD_TOO_SHORT);
    error.statusCode = 400;
    throw error;
  }

  // Email déjà utilisé
  const existing = await con.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    await log('warn', 'USER_REGISTER_FAILED', 'Email déjà utilisé', null, { email });
    const error = new Error(AUTH_EMAIL_ALREADY_USED);
    error.statusCode = 409;
    throw error;
  }

  // Hash + insertion
  const hash = await bcrypt.hash(password, 10);
  const result = await con.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
    [email, hash]
  );
  const user = result.rows[0];

  // Token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  await log('info', 'USER_REGISTER', 'Nouvel utilisateur créé', user.id, { email });
  return { token, user: { id: user.id, email: user.email } };
};

exports.loginUser = async (email, password) => {
  // Validation
  if (!email || !password) {
    const error = new Error(AUTH_CREDENTIALS_REQUIRED);
    error.statusCode = 400;
    throw error;
  }

  // Cherche le user
  const result = await con.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    await log('warn', 'USER_LOGIN_FAILED', 'Identifiants invalides', null, { email });
    const error = new Error(AUTH_INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];

  // Vérifie le mot de passe
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    await log('warn', 'USER_LOGIN_FAILED', 'Identifiants invalides', null, { email });
    const error = new Error(AUTH_INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  // Token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  await log('info', 'USER_LOGIN', 'Connexion réussie', user.id, { email });
  return { token, user: { id: user.id, email: user.email } };
};