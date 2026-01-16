import { Router } from 'express';
import { createEventHandler, getEventHandler, updateEventHandler, inviteUserHandler, joinEventHandler, drawEventHandler, getAssignmentHandler, getUserEventsHandler, getEventParticipantsHandler } from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authenticate);

router.post('/', createEventHandler);
router.get('/', getUserEventsHandler);
router.get('/:id', getEventHandler);
router.get('/:id/participants', getEventParticipantsHandler);
router.put('/:id', updateEventHandler);
router.post('/:id/invite', inviteUserHandler);
router.post('/:id/join', joinEventHandler);
router.post('/:id/draw', drawEventHandler);
router.get('/:id/my-assignment', getAssignmentHandler);

export default router;
