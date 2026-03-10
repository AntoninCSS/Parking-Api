const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { log } = require('../config/logger');
const {
  AUTH_CREDENTIALS_REQUIRED,
  AUTH_PASSWORD_TOO_SHORT,
  AUTH_EMAIL_ALREADY_USED,
  AUTH_INVALID_CREDENTIALS,
} = require('../constants/errors');
const {
  LOG_USER_REGISTER,
  LOG_USER_REGISTER_FAILED,
  LOG_USER_LOGIN,
  LOG_USER_LOGIN_FAILED,
} = require('../constants/logs');

exports.registerUser = async (email, password) => {
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
  const existing = await prisma.users.findUnique({
    where: { email },
  });

  if (existing) {
    await log('warn', LOG_USER_REGISTER_FAILED.action, LOG_USER_REGISTER_FAILED.message, null, { email });
    const error = new Error(AUTH_EMAIL_ALREADY_USED);
    error.statusCode = 409;
    throw error;
  }

  // Hash + insertion
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      email,
      password_hash: hash,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  // Token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  await log('info', LOG_USER_REGISTER.action, LOG_USER_REGISTER.message, user.id, { email });
  return { token, user: { id: user.id, email: user.email } };
};

exports.loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error(AUTH_CREDENTIALS_REQUIRED);
    error.statusCode = 400;
    throw error;
  }

  // Cherche le user
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    await log('warn', LOG_USER_LOGIN_FAILED.action, LOG_USER_LOGIN_FAILED.message, null, { email });
    const error = new Error(AUTH_INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  // Vérifie le mot de passe
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    await log('warn', LOG_USER_LOGIN_FAILED.action, LOG_USER_LOGIN_FAILED.message, null, { email });
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

  await log('info', LOG_USER_LOGIN.action, LOG_USER_LOGIN.message, user.id, { email });
  return { token, user: { id: user.id, email: user.email } };
};