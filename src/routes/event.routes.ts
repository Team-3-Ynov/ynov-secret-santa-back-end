import { Router } from 'express';
import { createEventHandler, updateEventHandler, inviteUserHandler, joinEventHandler, drawEventHandler, getAssignmentHandler } from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authenticate);

router.post('/', createEventHandler);
router.put('/:id', updateEventHandler);
router.post('/:id/invite', inviteUserHandler);
router.post('/:id/join', joinEventHandler);
router.post('/:id/draw', drawEventHandler);
router.get('/:id/my-assignment', getAssignmentHandler);

// PATCH /api/events/:id - Mettre à jour un événement (authentifié)
router.patch('/:id', authenticate, updateEventHandler);

export default router;
