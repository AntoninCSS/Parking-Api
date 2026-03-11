const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { log } = require("../config/logger");
const {
  AUTH_CREDENTIALS_REQUIRED,
  AUTH_PASSWORD_TOO_SHORT,
  AUTH_EMAIL_ALREADY_USED,
  AUTH_INVALID_CREDENTIALS,
  AUTH_REFRESH_TOKEN_MISSING,
  AUTH_REFRESH_TOKEN_INVALID,
  AUTH_REFRESH_TOKEN_REVOKED,
} = require("../constants/errors");
const {
  LOG_USER_REGISTER,
  LOG_USER_REGISTER_FAILED,
  LOG_USER_LOGIN,
  LOG_USER_LOGIN_FAILED,
  LOG_USER_REFRESH,
  LOG_USER_LOGOUT,
} = require("../constants/logs");

const generateAccessToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const generateRefreshToken = (user) =>
  jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

exports.refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/auth/refresh",
};

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
    await log(
      "warn",
      LOG_USER_REGISTER_FAILED.action,
      LOG_USER_REGISTER_FAILED.message,
      null,
      { email },
    );
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
  const token = generateAccessToken(user);

  await log(
    "info",
    LOG_USER_REGISTER.action,
    LOG_USER_REGISTER.message,
    user.id,
    { email },
  );
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
    await log(
      "warn",
      LOG_USER_LOGIN_FAILED.action,
      LOG_USER_LOGIN_FAILED.message,
      null,
      { email },
    );
    const error = new Error(AUTH_INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  // Vérifie le mot de passe
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    await log(
      "warn",
      LOG_USER_LOGIN_FAILED.action,
      LOG_USER_LOGIN_FAILED.message,
      null,
      { email },
    );
    const error = new Error(AUTH_INVALID_CREDENTIALS);
    error.statusCode = 401;
    throw error;
  }

  // Token
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refresh_tokens.create({
    data: { user_id: user.id, token: refreshToken },
  });

  await log("info", LOG_USER_LOGIN.action, LOG_USER_LOGIN.message, user.id, {
    email,
  });
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email },
  };
};

exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error(AUTH_REFRESH_TOKEN_MISSING);
    error.statusCode = 401;
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error(AUTH_REFRESH_TOKEN_INVALID);
    error.statusCode = 401;
    throw error;
  }

  // Vérifie qu'il n'est pas révoqué en base
  const stored = await prisma.refresh_tokens.findUnique({
    where: { token: refreshToken },
  });

  if (!stored) {
    const error = new Error(AUTH_REFRESH_TOKEN_REVOKED);
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  const accessToken = generateAccessToken(user);
  await log(
    "info",
    LOG_USER_REFRESH.action,
    LOG_USER_REFRESH.message,
    user.id,
    {},
  );
  return { accessToken };
};

exports.logoutUser = async (refreshToken, userId) => {
  if (!refreshToken) return;

  await prisma.refresh_tokens.deleteMany({
    where: { token: refreshToken },
  });

  await log('info', LOG_USER_LOGOUT.action, LOG_USER_LOGOUT.message, userId ?? null, {});
};