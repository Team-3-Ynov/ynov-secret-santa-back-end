import jwt from "jsonwebtoken";
import type { UserWithoutPassword } from "../types/user.types";

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const JWT_SECRET = getRequiredEnv("JWT_SECRET");
const REFRESH_TOKEN_SECRET = getRequiredEnv("REFRESH_TOKEN_SECRET");

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 jours
const INVITATION_TOKEN_EXPIRES_IN = "7d"; // 7 jours (token d'invitation)

export interface AccessTokenPayload {
  userId: number;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId: number;
  type: "refresh";
}

export interface InvitationTokenPayload {
  invitationId: string;
  eventId: string;
  email: string;
  type: 'invitation';
}
const isAccessTokenPayload = (value: unknown): value is AccessTokenPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.userId === "number" &&
    typeof payload.email === "string" &&
    payload.type === "access"
  );
};

const isRefreshTokenPayload = (value: unknown): value is RefreshTokenPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.userId === "number" && payload.type === "refresh";
};

/**
 * Génère un Access Token (courte durée, par défaut 15 minutes).
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
 * Génère un Refresh Token (longue durée, par défaut 7 jours).
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
 * Genere un token d'invitation
 */
export const signInvitationToken = (
  payload: Omit<InvitationTokenPayload, 'type'>,
): string => {
  return jwt.sign(
    {
      ...payload,
      type: 'invitation',
    },
    JWT_SECRET,
    { expiresIn: INVITATION_TOKEN_EXPIRES_IN },
  );
};

/**
 * Vérifie un Access Token
 */
export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const typedPayload = payload as Partial<AccessTokenPayload> & { [key: string]: unknown };

    if (typedPayload.type !== 'access') {
      return null;
    }

    if (typeof typedPayload.userId !== 'number' || typeof typedPayload.email !== 'string') {
      return null;
    }

    return typedPayload as AccessTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Vérifie un Refresh Token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    return isRefreshTokenPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
};

/**
 * Verifie un token d'invitation
 */
export const verifyInvitationToken = (token: string): InvitationTokenPayload | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as InvitationTokenPayload;
    if (payload.type !== 'invitation') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Extrait le token du header Authorization
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};
