const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validate } = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../schemas/auth.schema');


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: "Créer un compte utilisateur"
 *     description: "Crée un nouvel utilisateur, hashe son mot de passe et retourne un token JWT"
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "antonin@test.com"
 *               password:
 *                 type: string
 *                 minLength: 12
 *                 example: "monpassword123"
 *     responses:
 *       201:
 *         description: "Compte créé avec succès, token retourné"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "antonin@test.com"
 *       400:
 *         description: "Champs manquants ou mot de passe trop court"
 *         content:
 *           application/json:
 *             examples:
 *               Champs manquants:
 *                 value:
 *                   message: "Email et mot de passe requis"
 *               Mot de passe trop court:
 *                 value:
 *                   message: "Mot de passe trop court (12 caractères minimum)"
 *       409:
 *         description: "Email déjà utilisé"
 *         content:
 *           application/json:
 *             example:
 *               message: "Email déjà utilisé"
 *       500:
 *         description: "Erreur serveur"
 */
router.post("/register", validate(registerSchema), authController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: "Se connecter"
 *     description: "Vérifie les identifiants et retourne un token JWT valable 2h"
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "antonin@test.com"
 *               password:
 *                 type: string
 *                 example: "monpassword123"
 *     responses:
 *       200:
 *         description: "Connexion réussie, token retourné"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "antonin@test.com"
 *       400:
 *         description: "Champs manquants"
 *         content:
 *           application/json:
 *             example:
 *               message: "Email et mot de passe requis"
 *       401:
 *         description: "Identifiants invalides"
 *         content:
 *           application/json:
 *             example:
 *               message: "Identifiants invalides"
 *       500:
 *         description: "Erreur serveur"
 */
router.post("/login", validate(loginSchema),authController.login);

router.post('/refresh', authController.refresh); 

module.exports = router;