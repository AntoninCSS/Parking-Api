const express = require("express");
const router = express.Router({ mergeParams: true }); 
const reservationController = require("../controllers/reservationController");
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { paginate } = require('../middleware/pagination');

const { validate } = require('../middleware/validate');
const { reservationSchema, reservationPartialSchema } = require('../schemas/reservations.schema');




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
 *                   parking_id: 1
 *                   client_name: "Jean Dupont"
 *                   vehicle: "Voiture"
 *                   license_plate: "AB-123-CD"
 *                   checkin: "10/03/2026"
 *                   checkout: "11/03/2026"
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
 * /parkings/{parkingId}/reservations/{reservationId}:
 *   get:
 *     summary: "Récupérer une réservation par ID"
 *     description: "Retourne une réservation spécifique selon son identifiant"
 *     tags:
 *       - Reservations
 *     parameters:
 *       - $ref: '#/components/parameters/parkingId'
 *       - $ref: '#/components/parameters/reservationId'
 *     responses:
 *       200:
 *         description: "Réservation trouvée"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *             example:
 *               id: 1
 *               parking_id: 1
 *               client_name: "Jean Dupont"
 *               vehicle: "Voiture"
 *               license_plate: "AB-123-CD"
 *               checkin: "10/03/2026"
 *               checkout: "11/03/2026"
 *               created_at: "2026-03-01T10:00:00Z"
 *               updated_at: "2026-03-01T10:00:00Z"
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.get("/:reservationId", reservationController.getAllreservationById);

/**
 * @swagger
 * /parkings/{parkingId}/reservations:
 *   post:
 *     summary: "Créer une nouvelle réservation"
 *     description: "Crée une réservation pour un parking donné. Nécessite d'être authentifié."
 *     tags:
 *       - Reservations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/parkingId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *               - vehicle
 *               - license_plate
 *               - checkin
 *               - checkout
 *             properties:
 *               client_name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Jean Dupont"
 *               vehicle:
 *                 type: string
 *                 example: "Voiture"
 *               license_plate:
 *                 type: string
 *                 example: "AB-123-CD"
 *               checkin:
 *                 type: string
 *                 example: "10/03/2026"
 *                 description: "Format DD/MM/YYYY"
 *               checkout:
 *                 type: string
 *                 example: "11/03/2026"
 *                 description: "Format DD/MM/YYYY"
 *     responses:
 *       201:
 *         description: "Réservation créée avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Token manquant"
 *       403:
 *         description: "Token invalide ou expiré"
 *       404:
 *         description: "Parking non trouvé"
 *       500:
 *         description: "Erreur serveur"
 */
router.post("/",authenticate,validate(reservationSchema), reservationController.createReservation);

/**
 * @swagger
 * /parkings/{parkingId}/reservations/{reservationId}:
 *   put:
 *     summary: "Mettre à jour une réservation (complète)"
 *     description: "Remplace toutes les données d'une réservation existante. Nécessite d'être authentifié."
 *     tags:
 *       - Reservations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/parkingId'
 *       - $ref: '#/components/parameters/reservationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *               - vehicle
 *               - license_plate
 *               - checkin
 *               - checkout
 *             properties:
 *               client_name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Jean Dupont"
 *               vehicle:
 *                 type: string
 *                 example: "Voiture"
 *               license_plate:
 *                 type: string
 *                 example: "AB-123-CD"
 *               checkin:
 *                 type: string
 *                 example: "10/03/2026"
 *                 description: "Format DD/MM/YYYY"
 *               checkout:
 *                 type: string
 *                 example: "11/03/2026"
 *                 description: "Format DD/MM/YYYY"
 *     responses:
 *       200:
 *         description: "Réservation mise à jour"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Token manquant"
 *       403:
 *         description: "Token invalide ou expiré"
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.put("/:reservationId",authenticate,validate(reservationSchema), reservationController.updateReservation);

/**
 * @swagger
 * /parkings/{parkingId}/reservations/{reservationId}:
 *   patch:
 *     summary: "Mettre à jour une réservation (partielle)"
 *     description: "Modifie un ou plusieurs champs d'une réservation existante. Nécessite d'être authentifié."
 *     tags:
 *       - Reservations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/parkingId'
 *       - $ref: '#/components/parameters/reservationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               client_name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Jean Dupont"
 *               vehicle:
 *                 type: string
 *                 example: "Voiture"
 *               license_plate:
 *                 type: string
 *                 example: "AB-123-CD"
 *               checkin:
 *                 type: string
 *                 example: "10/03/2026"
 *                 description: "Format DD/MM/YYYY"
 *               checkout:
 *                 type: string
 *                 example: "11/03/2026"
 *                 description: "Format DD/MM/YYYY"
 *     responses:
 *       200:
 *         description: "Réservation partiellement mise à jour"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: "Aucun champ à modifier"
 *       401:
 *         description: "Token manquant"
 *       403:
 *         description: "Token invalide ou expiré"
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.patch("/:reservationId",authenticate,validate(reservationPartialSchema), reservationController.updatePartialReservation);

/**
 * @swagger
 * /parkings/{parkingId}/reservations/{reservationId}:
 *   delete:
 *     summary: "Supprimer une réservation"
 *     description: "Supprime définitivement une réservation. Réservé aux administrateurs."
 *     tags:
 *       - Reservations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/parkingId'
 *       - $ref: '#/components/parameters/reservationId'
 *     responses:
 *       200:
 *         description: "Réservation supprimée avec succès"
 *         content:
 *           application/json:
 *             example:
 *               message: "Réservation supprimée avec succès"
 *       401:
 *         description: "Token manquant"
 *       403:
 *         description: "Token invalide, expiré ou rôle insuffisant (admin requis)"
 *       404:
 *         description: "Réservation non trouvée"
 *       500:
 *         description: "Erreur serveur"
 */
router.delete("/:reservationId", authenticate,requireRole('admin'),reservationController.deleteReservation);

module.exports = router;