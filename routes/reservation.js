const express = require("express");
const router = express.Router({ mergeParams: true }); 
const reservationController = require("../controllers/reservationController");
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { paginate } = require('../middleware/pagination');



/**
 * @swagger
 * /parkings/{parkingId}/reservations:
 *   get:
 *     summary: "Récupérer toutes les réservations d'un parking"
 *     description: "Retourne la liste paginée des réservations d'un parking spécifique"
 *     tags:
 *       - Reservations
 *     parameters:
 *       - $ref: '#/components/parameters/parkingId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Numéro de la page"
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Nombre de résultats par page"
 *         example: 10
 *     responses:
 *       200:
 *         description: "Liste paginée des réservations"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 200
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 20
 *             example:
 *               data:
 *                 - id: 1
 *                   parking_id: 4
 *                   client_name: "Jean Dupont"
 *                   vehicle: "Voiture"
 *                   license_plate: "AB-123-CD"
 *                   checkin: "2026-03-10T08:00:00Z"
 *                   checkout: "2026-03-10T18:00:00Z"
 *                   created_at: "2026-03-01T10:00:00Z"
 *                   updated_at: "2026-03-01T10:00:00Z"
 *               pagination:
 *                 total: 200
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 20
 *       404:
 *         description: "Parking non trouvé"
 *       500:
 *         description: "Erreur serveur"
 */
router.get("/",paginate, reservationController.getAllreservation);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: "Récupérer une réservation par ID"
 *     description: "Retourne une réservation spécifique selon son identifiant"
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Identifiant de la réservation"
 *         example: 1
 *     responses:
 *       200:
 *         description: "Réservation trouvée"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.get("/:reservationId", reservationController.getAllreservationById);

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: "Créer une nouvelle réservation"
 *     description: "Crée une réservation pour un parking donné"
 *     tags:
 *       - Reservations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parking_id
 *               - user_id
 *               - start_date
 *               - end_date
 *             properties:
 *               parking_id:
 *                 type: integer
 *                 example: 3
 *               user_id:
 *                 type: integer
 *                 example: 7
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-10T08:00:00Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-10T18:00:00Z"
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: "Réservation créée avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: "Données invalides"
 *       500:
 *         description: "Erreur serveur"
 */
router.post("/",authenticate, reservationController.createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: "Mettre à jour une réservation (complète)"
 *     description: "Remplace toutes les données d'une réservation existante"
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Identifiant de la réservation"
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parking_id
 *               - user_id
 *               - start_date
 *               - end_date
 *               - status
 *             properties:
 *               parking_id:
 *                 type: integer
 *                 example: 3
 *               user_id:
 *                 type: integer
 *                 example: 7
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-10T08:00:00Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-10T18:00:00Z"
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *                 example: "confirmed"
 *     responses:
 *       200:
 *         description: "Réservation mise à jour"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.put("/:reservationId",authenticate, reservationController.updateReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   patch:
 *     summary: "Mettre à jour une réservation (partielle)"
 *     description: "Modifie un ou plusieurs champs d'une réservation existante"
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Identifiant de la réservation"
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parking_id:
 *                 type: integer
 *                 example: 3
 *               user_id:
 *                 type: integer
 *                 example: 7
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-10T08:00:00Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-10T18:00:00Z"
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *                 example: "cancelled"
 *     responses:
 *       200:
 *         description: "Réservation partiellement mise à jour"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.patch("/:reservationId",authenticate, reservationController.updatePartialReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: "Supprimer une réservation"
 *     description: "Supprime définitivement une réservation selon son identifiant"
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Identifiant de la réservation"
 *         example: 1
 *     responses:
 *       200:
 *         description: "Réservation supprimée avec succès"
 *         content:
 *           application/json:
 *             example:
 *               message: "Réservation supprimée avec succès"
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.delete("/:reservationId", authenticate,requireRole('admin'),reservationController.deleteReservation);

module.exports = router;