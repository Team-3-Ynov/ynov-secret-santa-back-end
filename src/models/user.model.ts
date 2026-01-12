import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { User, CreateUserDTO, UserWithoutPassword } from '../types/user.types';

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
      INSERT INTO users (email, password, username)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, created_at, updated_at
    `;
    const values = [userData.email, hashedPassword, userData.username];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Vérifie les identifiants et retourne l'utilisateur (sans password)
   */
  async verifyCredentials(email: string, password: string): Promise<UserWithoutPassword | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
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

