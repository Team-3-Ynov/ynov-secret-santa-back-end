import { pool } from "../config/database";

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked: boolean;
}

export const RefreshTokenModel = {
  /**
   * Enregistre un nouveau refresh token en base
   */
  async create(userId: number, token: string, expiresAt: Date): Promise<RefreshToken> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  },

  /**
   * Trouve un token en base
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const query = "SELECT * FROM refresh_tokens WHERE token = $1";
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  },

  /**
   * Revoque un token (soft delete ou flag)
   */
  async revoke(token: string): Promise<void> {
    const query = "UPDATE refresh_tokens SET revoked = true WHERE token = $1";
    await pool.query(query, [token]);
  },

  /**
   * Supprime tous les refresh tokens d'un utilisateur (logout global)
   */
  async revokeAllForUser(userId: number): Promise<void> {
    const query = "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1";
    await pool.query(query, [userId]);
  },
};
