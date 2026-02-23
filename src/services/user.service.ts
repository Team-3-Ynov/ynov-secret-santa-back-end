import { pool } from '../config/database';

export interface PublicUserProfile {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
}

export interface UserStats {
  eventsCreated: number;
  participations: number;
  giftsOffered: number;
}

/**
 * Récupère le profil public d'un utilisateur (sans email ni données sensibles)
 */
export const getPublicUserProfile = async (userId: number): Promise<PublicUserProfile | null> => {
  const result = await pool.query<PublicUserProfile>(
    'SELECT id, username, first_name, last_name, created_at FROM users WHERE id = $1',
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
    'SELECT id, username, first_name, last_name, created_at FROM users WHERE id = ANY($1)',
    [userIds]
  );
  return result.rows;
};

/**
 * Récupère les statistiques d'un utilisateur
 */
export const getUserStats = async (userId: number): Promise<UserStats> => {
  // Nombre d'événements créés
  const eventsResult = await pool.query(
    'SELECT COUNT(*) AS count FROM events WHERE owner_id = $1',
    [userId]
  );

  // Nombre de participations (invitations acceptées)
  const participationsResult = await pool.query(
    'SELECT COUNT(*) AS count FROM invitations WHERE user_id = $1 AND status = $2',
    [userId, 'accepted']
  );

  // Nombre de cadeaux offerts (assignments en tant que giver)
  const giftsResult = await pool.query(
    'SELECT COUNT(*) AS count FROM assignments WHERE giver_id = $1',
    [userId]
  );

  return {
    eventsCreated: parseInt(eventsResult.rows[0]?.count || '0', 10),
    participations: parseInt(participationsResult.rows[0]?.count || '0', 10),
    giftsOffered: parseInt(giftsResult.rows[0]?.count || '0', 10),
  };
};

