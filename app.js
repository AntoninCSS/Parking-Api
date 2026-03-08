// ******
// Configuration D'express
// 
// ******

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const parkingsRoutes = require("./routes/parkings");
const reservationRoutes = require("./routes/reservation");
const authRoutes = require("./routes/auth")
const errorHandler = require("./middleware/errorHandler");
const { parkingIdParam, reservationIdParam } = require("./middleware/validate");
const morgan = require('morgan');
const { winstonLogger } = require('./config/logger');

const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");

app.use(helmet());
const app = express();


app.use(helmet());


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Trop de tentatives, réessaie dans 15 minutes.' }
});
app.use('/auth', authLimiter);



app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

//LOG avec Morgan (HTTP/CLI) & Winston (Log papier & BDD)
app.use(morgan(':method :url :status :response-time ms', { 
  stream : { 
    write: (message) => winstonLogger.http(message.trim())
  }}))


// Validation automatique des params d'URL sur toutes les routes
app.param('parkingId', parkingIdParam);
app.param('reservationId', reservationIdParam);

// Routes
app.get("/", (req, res) => {
  res.send("Please chose a valid route");
});

app.use("/parkings", parkingsRoutes);
app.use('/parkings/:parkingId/reservations', reservationRoutes);
app.use('/auth', authRoutes);


// Gestion d'erreurs (./middleware/ParkingController.js)
app.use(errorHandler);

module.exports = app;