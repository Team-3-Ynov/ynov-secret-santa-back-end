import { Router } from 'express';
import { createEventHandler } from '../controllers/eventController';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

// POST /api/events - Créer un événement Secret Santa (authentifié)
router.post('/', authenticate, createEventHandler);

export default router;
