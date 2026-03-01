// ******
// Point d'entrée NodeJS
// 
// ******
require("dotenv").config(); 

const app = require("./app");

const PORT = process.env.PORT || 3446;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});