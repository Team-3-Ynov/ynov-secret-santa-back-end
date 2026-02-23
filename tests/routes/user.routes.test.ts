import request from 'supertest';
import app from '../../src/app';

// Mock du middleware authenticate
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  },
}));

// Mock du modèle user (utilisé par getMeHandler)
jest.mock('../../src/models/user.model', () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

// Mock du service user
jest.mock('../../src/services/user.service', () => ({
  getPublicUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  updateUserPassword: jest.fn(),
}));

const userService = require('../../src/services/user.service');
const { UserModel } = require('../../src/models/user.model');

// ─── Données de test ─────────────────────────────────────────────────────────

const mockMe = {
  id: 1,
  email: 'test@example.com',
  username: 'test_user',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const mockPublicProfile = {
  id: 2,
  username: 'john_doe',
  created_at: new Date('2026-01-01'),
};

// ─── GET /api/users/me ────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the authenticated user profile', async () => {
    (UserModel.findById as jest.Mock).mockResolvedValue(mockMe);

    const res = await request(app)
      .get('/api/users/me')
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(1);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(UserModel.findById).toHaveBeenCalledWith(1);
  });

  it('should return 404 if user not found in DB', async () => {
    (UserModel.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/users/me')
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Utilisateur non trouvé.');
  });

  it('should return 500 on unexpected error', async () => {
    (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const res = await request(app)
      .get('/api/users/me')
      .set('Accept', 'application/json');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── PUT /api/users/me ────────────────────────────────────────────────────────

describe('PUT /api/users/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update the profile successfully with a new username', async () => {
    const updatedUser = { ...mockMe, username: 'new_username' };
    (userService.updateUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      user: updatedUser,
    });

    const res = await request(app)
      .put('/api/users/me')
      .send({ username: 'new_username' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profil mis à jour avec succès');
    expect(res.body.data.user.username).toBe('new_username');
    expect(userService.updateUserProfile).toHaveBeenCalledWith(1, { username: 'new_username' });
  });

  it('should update the profile successfully with a new email', async () => {
    const updatedUser = { ...mockMe, email: 'new@example.com' };
    (userService.updateUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      user: updatedUser,
    });

    const res = await request(app)
      .put('/api/users/me')
      .send({ email: 'new@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('new@example.com');
  });

  it('should return 400 if email is already taken', async () => {
    (userService.updateUserProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Cet email est déjà utilisé par un autre compte',
    });

    const res = await request(app)
      .put('/api/users/me')
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cet email est déjà utilisé par un autre compte');
  });

  it('should return 400 if username is already taken', async () => {
    (userService.updateUserProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Ce nom d\'utilisateur est déjà pris',
    });

    const res = await request(app)
      .put('/api/users/me')
      .send({ username: 'taken_user' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Ce nom d\'utilisateur est déjà pris');
  });

  it('should return 400 if no field is provided (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if email format is invalid (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if username is too short (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ username: 'ab' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if username contains invalid characters (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ username: 'invalid user!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 on unexpected error', async () => {
    (userService.updateUserProfile as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const res = await request(app)
      .put('/api/users/me')
      .send({ username: 'valid_user' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── PUT /api/users/me/password ───────────────────────────────────────────────

describe('PUT /api/users/me/password', () => {
  beforeEach(() => jest.clearAllMocks());

  const validPayload = {
    currentPassword: 'OldPassword1',
    newPassword: 'NewPassword1',
  };

  it('should update the password successfully', async () => {
    (userService.updateUserPassword as jest.Mock).mockResolvedValue({ success: true });

    const res = await request(app)
      .put('/api/users/me/password')
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Mot de passe mis à jour avec succès');
    expect(userService.updateUserPassword).toHaveBeenCalledWith(
      1,
      validPayload.currentPassword,
      validPayload.newPassword
    );
  });

  it('should return 400 if current password is incorrect', async () => {
    (userService.updateUserPassword as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Mot de passe actuel incorrect',
    });

    const res = await request(app)
      .put('/api/users/me/password')
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Mot de passe actuel incorrect');
  });

  it('should return 400 if newPassword is missing (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'OldPassword1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if currentPassword is missing (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ newPassword: 'NewPassword1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if newPassword is too short (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'OldPassword1', newPassword: 'Ab1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if newPassword has no uppercase (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'OldPassword1', newPassword: 'nouppercase1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if newPassword has no lowercase (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'OldPassword1', newPassword: 'NOLOWERCASE1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if newPassword has no digit (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'OldPassword1', newPassword: 'NoDigitPass' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 on unexpected error', async () => {
    (userService.updateUserPassword as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const res = await request(app)
      .put('/api/users/me/password')
      .send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe('GET /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks());

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

  it('should return 500 on unexpected error', async () => {
    (userService.getPublicUserProfile as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const res = await request(app)
      .get('/api/users/2')
      .set('Accept', 'application/json');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
