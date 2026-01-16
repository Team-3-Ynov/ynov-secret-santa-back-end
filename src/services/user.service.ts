import { pool } from '../config/database';

export interface PublicUserProfile {
  id: number;
  username: string;
  created_at: Date;
}

/**
 * Récupère le profil public d'un utilisateur (sans email ni données sensibles)
 */
export const getPublicUserProfile = async (userId: number): Promise<PublicUserProfile | null> => {
  const result = await pool.query<PublicUserProfile>(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Récupère plusieurs profils publics (utile pour afficher les participants)
 */
export const getPublicUserProfiles = async (userIds: number[]): Promise<PublicUserProfile[]> => {
  if (userIds.length === 0) return [];

  const result = await pool.query<PublicUserProfile>(
    'SELECT id, username, created_at FROM users WHERE id = ANY($1)',
    [userIds]
  );
  return result.rows;
};
