import request from 'supertest';
import app from '../../app';

// Mock du middleware authenticate pour bypasser la vérification JWT en tests
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    // Injecter un email utilisateur pour simuler une authentification
    req.userEmail = 'test@example.com';
    next();
  }
}));

// Mock de la couche service pour ne pas toucher la BDD
jest.mock('../../services/eventService', () => ({
  createEvent: jest.fn().mockImplementation((payload) => Promise.resolve({
    id: 'uuid-1',
    title: payload.title,
    description: payload.description ?? null,
    eventDate: payload.eventDate,
    budget: payload.budget ?? null,
    ownerEmail: payload.ownerEmail,
    createdAt: new Date(),
  }))
}));

describe('POST /api/events', () => {
  it('should create an event when authenticated', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: 'Promo Event', eventDate: new Date(Date.now() + 3600 * 1000).toISOString() })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.ownerEmail).toBe('test@example.com');
  });

  it('should return 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: '' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

