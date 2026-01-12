import { Router } from 'express';
import { createEventHandler, updateEventHandler } from '../controllers/eventController';
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
// router.post('/', authenticate, createEventHandler); // Authentification désactivée pour le dev
router.post('/', createEventHandler);

/**
 * @openapi
 * /api/events/{id}:
 *   patch:
 *     tags:
 *       - Events
 *     summary: Mettre à jour un évènement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEventInput'
 *     responses:
 *       200:
 *         description: Evènement mis à jour
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Evènement non trouvé
 */
router.patch('/:id', authenticate, updateEventHandler);

export default router;
