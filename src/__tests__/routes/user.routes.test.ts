import request from 'supertest';
import app from '../../app';

// Mock du middleware authenticate
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  }
}));

// Mock du service user
const mockPublicProfile = {
  id: 2,
  username: 'john_doe',
  created_at: new Date('2026-01-01'),
};

jest.mock('../../services/user.service', () => ({
  getPublicUserProfile: jest.fn(),
}));

const userService = require('../../services/user.service');

describe('GET /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return public user profile', async () => {
    (userService.getPublicUserProfile as jest.Mock).mockResolvedValue(mockPublicProfile);

    const res = await request(app)
      .get('/api/users/2')
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(2);
    expect(res.body.data.username).toBe('john_doe');
    // Le profil public ne doit pas contenir l'email
    expect(res.body.data.email).toBeUndefined();
  });

  it('should return 404 if user not found', async () => {
    (userService.getPublicUserProfile as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/users/999')
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Utilisateur non trouvé.');
  });

  it('should return 400 for invalid user id', async () => {
    const res = await request(app)
      .get('/api/users/invalid-id')
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('ID utilisateur invalide.');
  });
});
