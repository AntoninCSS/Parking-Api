const errorHandler = (error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: error.message || "Erreur serveur"
  });
};

module.exports = errorHandler;