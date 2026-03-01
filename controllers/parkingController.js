const con = require('../config/db.js');

//Get
exports.getAllParkings = async (req, res, next) => {
  try {
    const result = await con.query("SELECT * FROM parkings");
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

//Get by ID
exports.getParkingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await con.query("SELECT * FROM parkings WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// POST créer
exports.createParking = async (req, res, next) => {
  try {
    const { name, city } = req.body;
    const result = await con.query(
      "INSERT INTO parkings (name, city) VALUES ($1, $2) RETURNING *",
      [name, city],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
// PUT modifier
exports.updateParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, city } = req.body;
    const result = await con.query(
      "UPDATE parkings SET name = $1, city = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, city, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE supprimer
exports.deleteParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await con.query(
      "DELETE FROM parkings WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
