import { UserModel } from '../../models/user.model';
import { pool } from '../../config/database';
import bcrypt from 'bcrypt';

// Mock de la connexion à la base de données
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock de bcrypt
jest.mock('bcrypt');

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should hash password and create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainPassword123',
        username: 'testuser',
      };

      const mockResult = {
        rows: [{
          id: 1,
          email: userData.email,
          username: userData.username,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await UserModel.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [userData.email, 'hashed_password', userData.username]
      );
      expect(result).toEqual(mockResult.rows[0]);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('verifyCredentials', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      username: 'testuser',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return user without password when credentials are valid', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await UserModel.verifyCredentials('test@example.com', 'correctPassword');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashed_password');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.verifyCredentials('notfound@example.com', 'password');

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is incorrect', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await UserModel.verifyCredentials('test@example.com', 'wrongPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashed_password');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user without password when found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserModel.findById(1);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const result = await UserModel.emailExists('test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.emailExists('notfound@example.com');

      expect(result).toBe(false);
    });
  });

  describe('usernameExists', () => {
    it('should return true when username exists', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const result = await UserModel.usernameExists('testuser');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM users WHERE username = $1',
        ['testuser']
      );
      expect(result).toBe(true);
    });

    it('should return false when username does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.usernameExists('notfound');

      expect(result).toBe(false);
    });
  });
});
