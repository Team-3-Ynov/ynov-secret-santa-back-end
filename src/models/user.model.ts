import { pool } from '../config/database';
import { User, CreateUserDTO, UserWithoutPassword } from '../types/user.types';

export const UserModel = {
  /**
   * Crée un nouvel utilisateur dans la base de données
   */
  async create(userData: CreateUserDTO): Promise<UserWithoutPassword> {
    const query = `
      INSERT INTO users (email, password, username)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, created_at, updated_at
    `;
    const values = [userData.email, userData.password, userData.username];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Trouve un utilisateur par son email
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  /**
   * Trouve un utilisateur par son ID
   */
  async findById(id: number): Promise<UserWithoutPassword | null> {
    const query = 'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Vérifie si un email existe déjà
   */
  async emailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  },

  /**
   * Vérifie si un username existe déjà
   */
  async usernameExists(username: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows.length > 0;
  },
};

