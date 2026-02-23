import { Router } from 'express';
import { getPublicProfileHandler, updateProfileHandler } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

// Toutes les routes users nécessitent d'être authentifié
router.use(authenticate);

// GET /api/users/:id - Profil public d'un utilisateur
router.get('/:id', getPublicProfileHandler);

// PUT /api/users/:id - Mettre à jour son profil
router.put('/:id', updateProfileHandler);

export default router;
