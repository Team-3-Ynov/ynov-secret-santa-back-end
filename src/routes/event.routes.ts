import { Router } from 'express';
import { createEventHandler, inviteUserHandler, updateEventHandler } from '../controllers/eventController';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

/**
 * @openapi
 * /api/events:
 *   post:
 *     tags:
 *       - Events
 *     summary: Créer un évènement Secret Santa
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               budget:
 *                 type: number
 *             required:
 *               - title
 *               - eventDate
 *     responses:
 *       201:
 *         description: Evènement créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticate, createEventHandler);

/**
 * @openapi
 * /api/events/{id}/invite:
 *   post:
 *     tags:
 *       - Events
 *     summary: Inviter un utilisateur à un évènement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       201:
 *         description: Invitation créée
 *       400:
 *         description: Email invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.post('/:id/invite', authenticate, inviteUserHandler);

export default router;
