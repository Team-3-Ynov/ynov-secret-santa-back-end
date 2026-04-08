import bcrypt from "bcrypt";
import { pool } from "../config/database";
import type { CreateUserDTO, UpdateUserDTO, User, UserWithoutPassword } from "../types/user.types";

const SALT_ROUNDS = 10;

export const UserModel = {
  /**
   * Crée un nouvel utilisateur dans la base de données
   * Le mot de passe est hashé automatiquement
   */
  async create(userData: CreateUserDTO): Promise<UserWithoutPassword> {
    // Hash du mot de passe (reste dans le modèle)
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (email, password, username, first_name, last_name, profile_image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, username, first_name, last_name, profile_image, created_at, updated_at
    `;
    const values = [
      userData.email,
      hashedPassword,
      userData.username,
      userData.first_name ?? null,
      userData.last_name ?? null,
      userData.profile_image,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Vérifie les identifiants et retourne l'utilisateur (sans password)
   */
  async verifyCredentials(email: string, password: string): Promise<UserWithoutPassword | null> {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    const user: User | undefined = result.rows[0];

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Destructure pour exclure password (s'adapte si le schema User change)
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Trouve un utilisateur par son ID
   */
  async findById(id: number): Promise<UserWithoutPassword | null> {
    const query =
      "SELECT id, email, username, first_name, last_name, profile_image, created_at, updated_at FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Vérifie si un email existe déjà
   */
  async emailExists(email: string): Promise<boolean> {
    const query = "SELECT 1 FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  },

  /**
   * Trouve un utilisateur par son Email (inclut le password pour vérification)
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  /**
   * Vérifie si un username existe déjà
   */
  async usernameExists(username: string): Promise<boolean> {
    const query = "SELECT 1 FROM users WHERE username = $1";
    const result = await pool.query(query, [username]);
    return result.rows.length > 0;
  },

  /**
   * Vérifie si un email existe déjà pour un autre utilisateur
   */
  async emailExistsForOtherUser(email: string, excludeUserId: number): Promise<boolean> {
    const query = "SELECT 1 FROM users WHERE email = $1 AND id != $2";
    const result = await pool.query(query, [email, excludeUserId]);
    return result.rows.length > 0;
  },

  /**
   * Vérifie si un username existe déjà pour un autre utilisateur
   */
  async usernameExistsForOtherUser(username: string, excludeUserId: number): Promise<boolean> {
    const query = "SELECT 1 FROM users WHERE username = $1 AND id != $2";
    const result = await pool.query(query, [username, excludeUserId]);
    return result.rows.length > 0;
  },

  /**
   * Met à jour le profil d'un utilisateur (email et/ou username)
   */
  async update(id: number, data: UpdateUserDTO): Promise<UserWithoutPassword | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    if (data.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(data.username);
    }

    if (data.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.first_name || null);
    }

    if (data.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.last_name || null);
    }

    if (data.profile_image !== undefined) {
      fields.push(`profile_image = $${paramIndex++}`);
      values.push(data.profile_image);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, first_name, last_name, profile_image, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  /**
   * Met à jour le mot de passe d'un utilisateur
   */
  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const query = `
      UPDATE users 
      SET password = $1
      WHERE id = $2
    `;

    const result = await pool.query(query, [hashedPassword, id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Vérifie le mot de passe actuel d'un utilisateur
   */
  async verifyPassword(id: number, password: string): Promise<boolean> {
    const query = "SELECT password FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    const user = result.rows[0];

    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  },
};
