import { pool } from "../config/database";
import { UserModel } from "../models/user.model";
import type { UpdateUserDTO, UserWithoutPassword } from "../types/user.types";

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

export interface UpdateProfileResult {
  success: boolean;
  user?: UserWithoutPassword;
  error?: string;
}

export interface UpdatePasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Récupère le profil public d'un utilisateur (sans email ni données sensibles)
 */
export const getPublicUserProfile = async (userId: number): Promise<PublicUserProfile | null> => {
  const result = await pool.query<PublicUserProfile>(
    "SELECT id, username, first_name, last_name, created_at FROM users WHERE id = $1",
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
    "SELECT id, username, first_name, last_name, created_at FROM users WHERE id = ANY($1)",
    [userIds]
  );
  return result.rows;
};

/**
 * Récupère les statistiques d'un utilisateur
 */
export const getUserStats = async (userId: number): Promise<UserStats> => {
  interface UserStatsRow {
    events_created: string;
    participations: string;
    gifts_offered: string;
  }
  const result = await pool.query<UserStatsRow>(
    `
      SELECT
        (SELECT COUNT(*) FROM events WHERE owner_id = $1) AS events_created,
        (SELECT COUNT(*) FROM invitations WHERE user_id = $1 AND status = $2) AS participations,
        (SELECT COUNT(*) FROM assignments WHERE giver_id = $1) AS gifts_offered
    `,
    [userId, "accepted"]
  );

  const row = result.rows[0];

  return {
    eventsCreated: Number.parseInt(row?.events_created ?? "0", 10),
    participations: Number.parseInt(row?.participations ?? "0", 10),
    giftsOffered: Number.parseInt(row?.gifts_offered ?? "0", 10),
  };
};
/**
 * Met à jour le profil d'un utilisateur (email et/ou username)
 */
export const updateUserProfile = async (
  userId: number,
  data: UpdateUserDTO
): Promise<UpdateProfileResult> => {
  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (data.email) {
    const emailExists = await UserModel.emailExistsForOtherUser(data.email, userId);
    if (emailExists) {
      return {
        success: false,
        error: "Cet email est déjà utilisé par un autre compte",
      };
    }
  }

  // Vérifier si le username est déjà utilisé par un autre utilisateur
  if (data.username) {
    const usernameExists = await UserModel.usernameExistsForOtherUser(data.username, userId);
    if (usernameExists) {
      return { success: false, error: "Ce nom d'utilisateur est déjà pris" };
    }
  }

  const updatedUser = await UserModel.update(userId, data);

  if (!updatedUser) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  return { success: true, user: updatedUser };
};

/**
 * Met à jour le mot de passe d'un utilisateur
 */
export const updateUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<UpdatePasswordResult> => {
  // Vérifier que le mot de passe actuel est correct
  const isPasswordValid = await UserModel.verifyPassword(userId, currentPassword);

  if (!isPasswordValid) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  // Mettre à jour le mot de passe
  const updated = await UserModel.updatePassword(userId, newPassword);

  if (!updated) {
    return {
      success: false,
      error: "Erreur lors de la mise à jour du mot de passe",
    };
  }

  return { success: true };
};
