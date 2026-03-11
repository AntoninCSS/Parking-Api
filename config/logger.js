const winston = require("winston");
const prisma = require("./prisma");  
const winstonLogger = winston.createLogger({
  level: "http",
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // ← uniquement ici
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),
    // Fichiers pour les Errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // Fichiers pour Toute les logs
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});


const logToDB = async (level, action, message, user_id = null, meta = {}) => {
  try {
    await prisma.logs.create({          // ← remplace con.query
      data: {
        level,
        action,
        message,
        user_id,
        meta,                           // Prisma gère le JSON natif, pas besoin de JSON.stringify
      },
    });
  } catch (error) {
    winstonLogger.error("Erreur insertion log en BDD", {
      error: error.message,
    });
  }
};

const log = async (level, action, message, user_id = null, meta = {}) => {
  winstonLogger[level](message, { action, user_id, meta });
  await logToDB(level, action, message, user_id, meta);
};

module.exports = { log, winstonLogger };
