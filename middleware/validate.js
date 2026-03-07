const { log } = require("../config/logger");

const validate = (schema) => async (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path[0],
      message: err.message,
    }));

    await log("warn", "VALIDATION_FAILED", "Validation échouée", null, {
      url: req.originalUrl,
      errors,
    });

    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Validation échouée",
      errors,
    });
  }

  req.body = result.data;
  next();
};

module.exports = { validate };