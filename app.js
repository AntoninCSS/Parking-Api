// ******
// Configuration D'express
// 
// ******

require("dotenv").config();
const express = require("express");
const parkingsRoutes = require("./routes/parkings");
const reservationsRoutes = require("./routes/reservation");
const errorHandler = require("./middleware/errorHandler");

const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");


const app = express();

// Middlewares
app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));



app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("Please chose a valid route");
});

app.use("/parkings", parkingsRoutes);
app.use("/reservations", reservationsRoutes);


// Gestion d'erreurs (./middleware/ParkingController.js)
app.use(errorHandler);

module.exports = app;