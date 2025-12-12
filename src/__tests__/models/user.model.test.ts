import { UserModel } from '../../models/user.model';
import { pool } from '../../config/database';

// Mock de la connexion à la base de données
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user and return user without password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed_password',
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

      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await UserModel.create(userData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [userData.email, userData.password, userData.username]
      );
      expect(result).toEqual(mockResult.rows[0]);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserModel.findByEmail('test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.findByEmail('notfound@example.com');

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

