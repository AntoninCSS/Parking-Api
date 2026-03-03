const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

/**
 * @swagger
 * /parkings:
 *   get:
 *     summary: "Récupérer tous les parkings"
 *     description: "Retourne une liste de tous les parkings enregistrés dans la base de données"
 *     tags:
 *       - Parkings
 *     responses:
 *       200:
 *         description: "Liste de tous les parkings"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parking'
 *             example:
 *               - id: 1
 *                 name: "Parking A"
 *                 city: "Paris"
 *                 type: "outdoor"
 *                 created_at: "2026-03-01T10:00:00Z"
 *                 updated_at: "2026-03-01T10:00:00Z"
 *               - id: 2
 *                 name: "Parking B"
 *                 city: "Lyon"
 *                 type: "indoor"
 *                 created_at: "2026-03-01T11:00:00Z"
 *                 updated_at: "2026-03-01T11:00:00Z"
 *       500:
 *         description: "Erreur serveur"
 */
router.get("/", reservationController.getAllreservation);
router.get("/:id", reservationController.getAllreservationById);
router.post("/", reservationController.createReservation);
router.put("/:id", reservationController.updateReservation);
router.delete("/:id", reservationController.deleteReservation);
router.patch("/:id", reservationController.updatePartialReservation);


module.exports = router;