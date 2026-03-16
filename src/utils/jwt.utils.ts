import jwt from "jsonwebtoken";
import type { UserWithoutPassword } from "../types/user.types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh-secret-change-in-production";

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 jours

export interface AccessTokenPayload {
  userId: number;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId: number;
  type: "refresh";
}

/**
 * Génère un Access Token (courte durée)
 */
export const signAccessToken = (user: UserWithoutPassword): string => {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    type: "access",
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

/**
 * Génère un Refresh Token (longue durée)
 */
export const signRefreshToken = (userId: number): string => {
  const payload: RefreshTokenPayload = {
    userId,
    type: "refresh",
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Vérifie un Access Token
 */
export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Vérifie un Refresh Token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Extrait le token du header Authorization
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};
