import { Router } from 'express';
import {
    createEventHandler,
    updateEventHandler,
    inviteUserHandler,
    getEventByIdHandler,
    getUserEventsHandler
} from '../controllers/eventController';
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
 * /api/events:
 *   get:
 *     tags:
 *       - Events
 *     summary: Récupérer les évènements de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des évènements
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticate, getUserEventsHandler);

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Récupérer un évènement par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de l'évènement
 *       404:
 *         description: Evènement non trouvé
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticate, getEventByIdHandler);

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
 *     responses:
 *       200:
 *         description: Evènement mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id', authenticate, updateEventHandler);

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
