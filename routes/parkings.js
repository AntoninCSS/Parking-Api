const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");
const { authenticate, requireRole } = require('../middleware/authMiddleware');

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
router.get("/", parkingController.getAllParkings);
/**
 * @swagger
 * /parkings/{id}:
 *   get:
 *     summary: "Récupérer un parking par ID"
 *     description: "Retourne les informations détaillées d'un parking spécifique"
 *     tags:
 *       - Parkings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID unique du parking"
 *         example: 1
 *     responses:
 *       200:
 *         description: "Parking trouvé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parking'
 *             example:
 *               id: 1
 *               name: "Parking A"
 *               city: "Paris"
 *               type: "outdoor"
 *               created_at: "2026-03-01T10:00:00Z"
 *               updated_at: "2026-03-01T10:00:00Z"
 *       404:
 *         description: "Parking non trouvé"
 *         content:
 *           application/json:
 *             example:
 *               message: "Parking not found"
 *       500:
 *         description: "Erreur serveur"
 */
router.get("/:parkingId", parkingController.getParkingById);
/**
 * @swagger
 * /parkings:
 *   post:
 *     summary: "Créer un nouveau parking"
 *     description: "Crée un nouveau parking dans la base de données"
 *     tags:
 *       - Parkings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Nom du parking"
 *                 example: "Parking A"
 *               city:
 *                 type: string
 *                 description: "Ville où se trouve le parking"
 *                 example: "Paris"
 *               type:
 *                 type: string
 *                 enum: ["outdoor", "indoor", "underground"]
 *                 description: "Type de parking"
 *                 example: "outdoor"
 *     responses:
 *       201:
 *         description: "Parking créé avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parking'
 *             example:
 *               id: 3
 *               name: "Parking A"
 *               city: "Paris"
 *               type: "outdoor"
 *               created_at: "2026-03-01T12:00:00Z"
 *               updated_at: "2026-03-01T12:00:00Z"
 *       400:
 *         description: "Données invalides"
 *         content:
 *           application/json:
 *             example:
 *               message: "Mauvaises données dans le body"
 *       500:
 *         description: "Erreur serveur"
 */
router.post("/", authenticate, parkingController.createParking);
/**
 * @swagger
 * /parkings/{id}:
 *   put:
 *     summary: "Modifier un parking"
 *     description: "Modifie les informations d'un parking existant"
 *     tags:
 *       - Parkings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID unique du parking"
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Nom du parking"
 *                 example: "Parking A Updated"
 *               city:
 *                 type: string
 *                 description: "Ville où se trouve le parking"
 *                 example: "Lyon"
 *               type:
 *                 type: string
 *                 enum: ["outdoor", "indoor", "underground"]
 *                 description: "Type de parking"
 *                 example: "indoor"
 *     responses:
 *       200:
 *         description: "Parking modifié avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parking'
 *             example:
 *               id: 1
 *               name: "Parking A Updated"
 *               city: "Lyon"
 *               type: "indoor"
 *               created_at: "2026-03-01T10:00:00Z"
 *               updated_at: "2026-03-01T15:30:00Z"
 *       400:
 *         description: "Données invalides"
 *         content:
 *           application/json:
 *             example:
 *               message: "Mauvaises données dans le body"
 *       404:
 *         description: "Parking non trouvé"
 *         content:
 *           application/json:
 *             example:
 *               message: "Parking not found"
 *       500:
 *         description: "Erreur serveur"
 */
router.put("/:parkingId",authenticate,  parkingController.updateParking);
/**
 * @swagger
 * /parkings/{parkingId}:
 *   patch:
 *     summary: "Mise à jour partielle d'un parking"
 *     description: "Modifie un ou plusieurs champs d'un parking. Seuls les champs envoyés dans le body seront mis à jour."
 *     tags:
 *       - Parkings
 *     parameters:
 *       - in: path
 *         name: parkingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Identifiant du parking"
 *         example: 4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Parking Central"
 *               city:
 *                 type: string
 *                 example: "Paris"
 *               type:
 *                 type: string
 *                 enum: [indoor, outdoor]
 *                 example: "indoor"
 *           examples:
 *             Modifier le nom uniquement:
 *               value:
 *                 name: "Nouveau Nom"
 *             Modifier plusieurs champs:
 *               value:
 *                 name: "Parking Central"
 *                 city: "Lyon"
 *                 type: "outdoor"
 *     responses:
 *       200:
 *         description: "Parking mis à jour avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parking'
 *             example:
 *               id: 4
 *               name: "Parking Central"
 *               city: "Paris"
 *               type: "indoor"
 *               created_at: "2026-03-01T10:00:00Z"
 *               updated_at: "2026-03-04T14:00:00Z"
 *       400:
 *         description: "Aucun champ à modifier"
 *         content:
 *           application/json:
 *             example:
 *               message: "Aucun champ à modifier"
 *       404:
 *         description: "Parking non trouvé"
 *         content:
 *           application/json:
 *             example:
 *               message: "Parking not found"
 *       500:
 *         description: "Erreur serveur"
 */
router.patch("/:parkingId" , authenticate,  parkingController.updatePartialParking)
/**
 * @swagger
 * /parkings/{id}:
 *   delete:
 *     summary: "Supprimer un parking"
 *     description: "Supprime un parking existant de la base de données"
 *     tags:
 *       - Parkings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID unique du parking"
 *         example: 1
 *     responses:
 *       200:
 *         description: "Parking supprimé avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parking'
 *             example:
 *               id: 1
 *               name: "Parking A"
 *               city: "Paris"
 *               type: "outdoor"
 *               created_at: "2026-03-01T10:00:00Z"
 *               updated_at: "2026-03-01T10:00:00Z"
 *       404:
 *         description: "Parking non trouvé"
 *         content:
 *           application/json:
 *             example:
 *               message: "Parking not found"
 *       500:
 *         description: "Erreur serveur"
 */
router.delete("/:parkingId",authenticate, requireRole('admin'), parkingController.deleteParking);

module.exports = router;