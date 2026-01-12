import { Router } from 'express';
import { createEventHandler } from '../controllers/eventController';
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

export default router;
