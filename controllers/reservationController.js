const con = require("../config/db.js");
const { log } = require("../config/logger");

function convertToISO(dateString) {
  const [day, month, year] = dateString.split("/");
  return new Date(`${year}-${month}-${day}`).toISOString();
}

//Get
exports.getAllreservation = async (req, res, next) => {
  try {
    const { parkingId } = req.params;
    const { page, limit, offset } = req.pagination;

    const total = await con.query(
      "SELECT COUNT(*) FROM reservations WHERE parking_id = $1",
      [parkingId],
    );

    const totalCount = parseInt(total.rows[0].count);

    const result = await con.query(
      "SELECT * FROM reservations WHERE parking_id = $1 ORDER BY id LIMIT $2 OFFSET $3 ",
      [parkingId, limit, offset],
    );

    res.status(200).json({
      data: result.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get by ID
exports.getAllreservationById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.reservationId);
    const { parkingId } = req.params;
    const result = await con.query(
      "SELECT * FROM reservations where id = $1 AND parking_id = $2",
      [id, parkingId],
    );

    if (result.rows.length === 0) {
      await log(
        "warn",
        "RESERVATION_NOT_FOUND",
        "Réservation introuvable",
        null,
        {
          parkingId,
          reservationId: id,
        },
      );
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// POST créer
exports.createReservation = async (req, res, next) => {
  try {
    const { parkingId } = req.params;
    let { client_name, vehicle, license_plate, checkin, checkout } = req.body;
    checkin = convertToISO(checkin);
    checkout = convertToISO(checkout);
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    if (checkinDate > checkoutDate) {
      await log(
        "warn",
        "RESERVATION_INVALID_DATES",
        "Date de check-in après check-out",
        req.user?.userId,
        {
          parkingId,
          checkin,
          checkout,
        },
      );
      return res.status(400).json({
        message: "La date de check-in doit être avant la date de check-out",
      });
    }

    const result = await con.query(
      "INSERT INTO reservations (parking_id, client_name, vehicle, license_plate, checkin, checkout) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [parkingId, client_name, vehicle, license_plate, checkin, checkout],
    );

    await log(
      "info",
      "RESERVATION_CREATED",
      "Réservation créée",
      req.user?.userId,
      {
        parkingId,
        reservationId: result.rows[0].id,
      },
    );
    res.status(201).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// PUT Update d'une réservation
exports.updateReservation = async (req, res, next) => {
  try {
    const requiredFields = [
      "client_name",
      "vehicle",
      "license_plate",
      "checkin",
      "checkout",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      await log(
        "warn",
        "RESERVATION_MISSING_FIELDS",
        "Champs manquants",
        req.user?.userId,
        {
          missingFields,
        },
      );
      return res.status(400).json({
        message: `Champs manquants : ${missingFields.join(", ")}`,
      });
    }

    const { parkingId, reservationId } = req.params;
    let { client_name, vehicle, license_plate, checkin, checkout } = req.body;

    checkin = convertToISO(checkin);
    checkout = convertToISO(checkout);
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    if (checkinDate > checkoutDate) {
      await log(
        "warn",
        "RESERVATION_INVALID_DATES",
        "Date de check-in après check-out",
        req.user?.userId,
        {
          parkingId,
          reservationId,
        },
      );
      return res.status(400).json({
        message: "La date de check-in doit être avant la date de check-out",
      });
    }

    const result = await con.query(
      "UPDATE reservations SET parking_id = $1, client_name = $2, vehicle = $3, license_plate = $4, checkin = $5, checkout = $6, updated_at = NOW() WHERE id = $7 RETURNING *",
      [
        parkingId,
        client_name,
        vehicle,
        license_plate,
        checkin,
        checkout,
        reservationId,
      ],
    );

    if (result.rows.length === 0) {
      await log(
        "warn",
        "RESERVATION_NOT_FOUND",
        "Réservation introuvable",
        req.user?.userId,
        {
          parkingId,
          reservationId,
        },
      );
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    await log(
      "info",
      "RESERVATION_UPDATED",
      "Réservation mise à jour",
      req.user?.userId,
      {
        parkingId,
        reservationId: result.rows[0].id,
      },
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// DELETE supprimer
exports.deleteReservation = async (req, res, next) => {
  try {
    const { parkingId, reservationId } = req.params;
    const result = await con.query(
      "DELETE FROM reservations WHERE id = $1 AND parking_id = $2 RETURNING *",
      [reservationId, parkingId],
    );

    if (result.rows.length === 0) {
      await log(
        "warn",
        "RESERVATION_NOT_FOUND",
        "Réservation introuvable",
        null,
        {
          parkingId,
          reservationId,
        },
      );
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    await log(
      "info",
      "RESERVATION_DELETED",
      "Réservation supprimée",
      req.user?.userId,
      {
        parkingId,
        reservationId,
      },
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// PATCH
exports.updatePartialReservation = async (req, res, next) => {
  try {
    const parkingId = parseInt(req.params.parkingId);
    const reservationId = parseInt(req.params.reservationId);
    const updates = req.body;

    const allowedFields = [
      "client_name",
      "vehicle",
      "license_plate",
      "checkin",
      "checkout",
    ];

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      await log(
        "warn",
        "RESERVATION_NO_FIELDS",
        "Aucun champ à modifier",
        req.user?.userId,
      );
      return res.status(400).json({ message: "Aucun champ à modifier" });
    }

    values.push(reservationId);
    values.push(parkingId);

    const sql = `
      UPDATE reservations 
      SET ${fields.join(", ")}, updated_at = NOW() 
      WHERE id = $${paramIndex} AND parking_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await con.query(sql, values);

    if (result.rows.length === 0) {
      await log(
        "warn",
        "RESERVATION_NOT_FOUND",
        "Réservation introuvable",
        req.user?.userId,
        {
          parkingId,
          reservationId,
        },
      );
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    await log(
      "info",
      "RESERVATION_PARTIALLY_UPDATED",
      "Réservation partiellement mise à jour",
      req.user?.userId,
      {
        parkingId,
        reservationId: result.rows[0].id,
      },
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
