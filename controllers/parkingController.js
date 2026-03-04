const con = require("../config/db.js");
const { log } = require("../config/logger");

//Get
exports.getAllParkings = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination;

    const total = await con.query("SELECT COUNT(*) FROM parkings");
    const totalCount = parseInt(total.rows[0].count);
    const result = await con.query(
      "SELECT * FROM parkings ORDER BY id LIMIT $1 OFFSET $2 ",
      [limit, offset],
    );

    res.status(200).json({
      data: result.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get by ID
exports.getParkingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const result = await con.query("SELECT * FROM parkings WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      await log("warn", "PARKING_NOT_FOUND", "Parking introuvable", null, {
        parkingId: id,
      });
      return res.status(404).json({ message: "Parking introuvable" });
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
    await log("info", "PARKING_CREATED", "Parking créé", req.user?.userId, {
      parkingId: result.rows[0].id,
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
// PUT modifier
exports.updateParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const { name, city } = req.body;
    const result = await con.query(
      "UPDATE parkings SET name = $1, city = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, city, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }
    await log("info", "PARKING_UPDATED", "Parking modifié", req.user?.userId, {
      parkingId: result.rows[0].id,
    });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE supprimer
exports.deleteParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const result = await con.query(
      "DELETE FROM parkings WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parking not found" });
    }
    await log("info", "PARKING_DELETED", "Parking suprimé", req.user?.userId, {
      parkingId: result.rows[0].id,
    });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

//PATCH modifications partielle

exports.updatePartialParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const updates = req.body;

    // Champs autorisés
    const allowedFields = ["name", "city", "type"];

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
      await log(
        "warn",
        "MODIFICATION_FAILED",
        "Aucun champ a modifié valable",
        req.user?.userId,
        {},
      );
      return res.status(400).json({ message: "Aucun champ à modifier" });
    }

    values.push(id);

    // Construis et exécute
    const sql = `UPDATE parkings SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const result = await con.query(sql, values);

    if (result.rows.length === 0) {
      await log(
        "warn",
        "PARKING_NOT_FOUND",
        "Parking non trouvé",
        req.user?.userId,
        {
          parkingId: id,
        },
      );
      return res.status(404).json({ message: "Parking non trouvé" });
    }
    await log(
      "info",
      "PARKING_PARTIALLY_UPDATED",
      "Parking modifié",
      req.user?.userId,
      {
        parkingId: result.rows[0].id,
      },
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
