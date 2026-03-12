// ******
// Point d'entrée NodeJS
// 
// ******
require("dotenv").config(); 

const app = require("./app");

const PORT = process.env.PORT || 3446;


// app.js
const { timeoutMiddleware } = './middlewares/timeout.js';

app.use(timeoutMiddleware(30_000)); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});