import { Router } from 'express';
import { 
  getPublicProfileHandler, 
  getMeHandler,
  updateProfileHandler,
  updatePasswordHandler
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updateProfileSchema, updatePasswordSchema } from '../schemas/user.schema';

const router: Router = Router();

// Toutes les routes users nécessitent d'être authentifié
router.use(authenticate);

// Routes pour l'utilisateur connecté (doivent être AVANT /:id pour éviter les conflits)
// GET /api/users/me - Profil de l'utilisateur connecté
router.get('/me', getMeHandler);

// PUT /api/users/me - Mettre à jour le profil (email, username)
router.put('/me', validate(updateProfileSchema), updateProfileHandler);

// PUT /api/users/me/password - Mettre à jour le mot de passe
router.put('/me/password', validate(updatePasswordSchema), updatePasswordHandler);

// GET /api/users/:id - Profil public d'un utilisateur
router.get('/:id', getPublicProfileHandler);

// PUT /api/users/:id - Mettre à jour son profil
router.put('/:id', updateProfileHandler);

export default router;
