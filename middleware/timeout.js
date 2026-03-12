
const { TIMEOUT_ERROR } = require("../constants/errors");
const { log } = require("../utils/logger");


const timeoutMiddleware = (delay = 30_000) =>(req, res, next) => {
  const timer = setTimeout(async () => {
    if (!res.headersSent) {
      res.status(503).json({ message: 'Request timeout' });
          await log(
      "warn",
      TIMEOUT_ERROR .action,
      TIMEOUT_ERROR .message,
      null,
      {},
    );
    }
  }, delay);
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));

  next();
};

module.exports = { timeoutMiddleware };