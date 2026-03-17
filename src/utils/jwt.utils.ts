import jwt, { type SignOptions } from 'jsonwebtoken';
import { UserWithoutPassword } from '../types/user.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-in-production';

const ACCESS_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const INVITATION_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.INVITATION_TOKEN_EXPIRES_IN as SignOptions['expiresIn']) || '7d';

export interface AccessTokenPayload {
  userId: number;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: number;
  type: 'refresh';
}

export interface InvitationTokenPayload {
  invitationId: string;
  eventId: string;
  email: string;
  type: 'invitation';
}

/**
 * Génère un Access Token (courte durée)
 */
export const signAccessToken = (user: UserWithoutPassword): string => {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

/**
 * Génère un Refresh Token (longue durée)
 */
export const signRefreshToken = (userId: number): string => {
  const payload: RefreshTokenPayload = {
    userId,
    type: 'refresh',
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
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
  } catch (error) {
    return null;
  }
};

/**
 * Vérifie un Refresh Token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch (error) {
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

