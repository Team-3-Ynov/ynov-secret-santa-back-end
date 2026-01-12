import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt.utils';

/**
 * Middleware d'authentification qui vérifie le JWT et ajoute userId et userEmail à req
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization as string | undefined;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({ success: false, message: 'Token d\'authentification manquant ou invalide' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Token invalide' });
    return;
  }

  // Attacher les informations utilisateur à la requête pour les handlers suivants
  (req as any).userId = payload.userId;
  (req as any).userEmail = payload.email;

  next();
};

