import { Router } from 'express';
import { createEventHandler, updateEventHandler, inviteUserHandler } from '../controllers/eventController';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

// POST /api/events - Créer un événement Secret Santa (authentifié)
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
