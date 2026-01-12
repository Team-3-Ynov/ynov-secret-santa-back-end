import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router: Router = Router();

// POST /api/auth/register - Créer un compte utilisateur
router.post('/register', validate(registerSchema), AuthController.register);

// POST /api/auth/login - Se connecter
router.post('/login', validate(loginSchema), AuthController.login);

export default router;
