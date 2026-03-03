const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");

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
router.get("/:id", parkingController.getParkingById);

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
router.post("/", parkingController.createParking);

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
router.put("/:id", parkingController.updateParking);

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
router.delete("/:id", parkingController.deleteParking);


router.patch("/:id" , parkingController.updatePartialParking);

module.exports = router;