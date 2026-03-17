import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const router: Router = Router();

router.post("/register", validate(registerSchema), AuthController.register);

router.post("/login", validate(loginSchema), AuthController.login);

router.post("/refresh", AuthController.refresh);

router.use(authenticate);

router.post("/logout", AuthController.logout);

router.get("/me", AuthController.getMe);

export default router;
