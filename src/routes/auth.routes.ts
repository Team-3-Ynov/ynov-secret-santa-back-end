import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Créer un compte utilisateur
 *     description: |
 *       Inscription d'un nouvel utilisateur.
 *       
 *       **Règles du mot de passe:**
 *       - Minimum 8 caractères
 *       - Au moins 1 majuscule (A-Z)
 *       - Au moins 1 minuscule (a-z)
 *       - Au moins 1 chiffre (0-9)
 *       
 *       **Règles du nom d'utilisateur:**
 *       - Entre 3 et 50 caractères
 *       - Lettres, chiffres et underscores uniquement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             valid:
 *               summary: Exemple valide
 *               value:
 *                 email: "user@example.com"
 *                 password: "MonMotDePasse123"
 *                 username: "johndoe"
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Email ou nom d'utilisateur déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               emailExists:
 *                 summary: Email déjà utilisé
 *                 value:
 *                   success: false
 *                   message: "Cet email est déjà utilisé"
 *               usernameExists:
 *                 summary: Nom d'utilisateur déjà pris
 *                 value:
 *                   success: false
 *                   message: "Ce nom d'utilisateur est déjà pris"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Se connecter
 *     description: Authentification d'un utilisateur existant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             valid:
 *               summary: Exemple de connexion
 *               value:
 *                 email: "user@example.com"
 *                 password: "MonMotDePasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: "Connexion réussie"
 *               data:
 *                 user:
 *                   id: 1
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   created_at: "2025-12-12T12:00:00.000Z"
 *                   updated_at: "2025-12-12T12:00:00.000Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Email ou mot de passe incorrect"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validate(loginSchema), AuthController.login);

export default router;
