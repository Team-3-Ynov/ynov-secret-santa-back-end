import type { NextFunction, Request, Response } from "express";
import { extractTokenFromHeader, verifyAccessToken } from "../utils/jwt.utils";

// Extension de l'interface Request pour inclure les infos de l'utilisateur
// Cela assure un typage strict dans les contrôleurs
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
  };
}

/**
 * Middleware d'authentification
 * Vérifie le token JWT et injecte les infos utilisateur dans req.user
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Accès non autorisé : Token manquant",
      });
      return;
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: "Accès non autorisé : Token invalide ou expiré",
      });
      return;
    }

    // On attache l'utilisateur à la requête avec un cast explicite pour satisfaire le typage
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    console.error("Erreur middleware auth:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'authentification",
    });
  }
};
