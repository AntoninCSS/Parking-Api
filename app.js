// ******
// Configuration D'express
// 
// ******

require("dotenv").config();
const express = require("express");
const parkingsRoutes = require("./routes/parkings");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middlewares
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send(" API");
});

app.use("/parkings", parkingsRoutes);

// Gestion d'erreurs (./middleware/ParkingController.js)
app.use(errorHandler);

module.exports = app;