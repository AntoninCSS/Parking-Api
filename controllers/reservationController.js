const con = require("../config/db.js");

function convertToISO(dateString) {
  const [day, month, year] = dateString.split("/");
  return new Date(`${year}-${month}-${day}`).toISOString();
}

//Get
exports.getAllreservation = async (req, res, next) => {
  try {
    const result = await con.query("SELECT * FROM reservations");
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};
// Get by ID
exports.getAllreservationById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await con.query("SELECT * FROM reservations where id = $1", [
      id,
    ]);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// POST créer
exports.createReservation = async (req, res, next) => {
  try {
    let { parking_id, client_name, vehicle, license_plate, checkin, checkout } =
      req.body;
    checkin = convertToISO(checkin);
    checkout = convertToISO(checkout);
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    if (checkinDate > checkoutDate) {
      return res.status(400).json({
        message: "La date de check-in doit être avant la date de check-out ",
      });
    }

    const result = await con.query(
      "INSERT INTO reservations (parking_id, client_name, vehicle, license_plate, checkin, checkout) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [parking_id, client_name, vehicle, license_plate, checkin, checkout],
    );
    res.status(201).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// PUT Update d'une réservation

exports.updateReservation = async (req, res, next) => {
  try {
    let { parking_id, client_name, vehicle, license_plate, checkin, checkout } =
      req.body;
    const id = parseInt(req.params.id);
    checkin = convertToISO(checkin);
    checkout = convertToISO(checkout);
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    if (checkinDate > checkoutDate) {
      return res.status(400).json({
        message: "La date de check-in doit être avant la date de check-out ",
      });
    }

    const result = await con.query(
      "UPDATE reservations SET parking_id = $1, client_name = $2, vehicle = $3, license_plate = $4, checkin = $5, checkout = $6, updated_at = NOW() WHERE id = $7 RETURNING *",
      [parking_id, client_name, vehicle, license_plate, checkin, checkout, id],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// DELETE supprimer
exports.deleteReservation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await con.query(
      "DELETE FROM reservations WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

//PATCH Modification partielle
exports.updatePartialReservation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    /**
     * {"parking_id" : 1 , "client_name" : "Super Nom"}
     * 
     * 
     * 
     * 
     */

    // Champs autorisés
    const allowedFields = ["parking_id", "client_name", "vehicle","license_plate","checkin","checkout"]

    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Boucle sur les champs
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }

    // Si aucun champ
    if (fields.length === 0) {
      return res.status(400).json({ message: "Aucun champ à modifier" });
    }

    values.push(id);

    // Construis et exécute
    const sql = `UPDATE reservations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const result = await con.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};