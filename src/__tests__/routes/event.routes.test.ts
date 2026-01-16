import request from 'supertest';
import app from '../../app';

// Mock du middleware authenticate pour bypasser la vérification JWT en tests
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    // Injecter un user complet comme le fait le middleware
    req.user = { id: 1, email: 'test@example.com' };
    next();
  }
}));

// Mock du service email pour éviter les erreurs de connexion SMTP
jest.mock('../../services/email.service', () => ({
  sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock de la couche service pour ne pas toucher la BDD
const mockEvent = {
  id: 'event-uuid-123',
  title: 'Original Title',
  description: 'Original Description',
  eventDate: new Date(),
  budget: 20,
  ownerId: 1, // Changed from ownerEmail to ownerId
  createdAt: new Date(),
};

jest.mock('../../services/event.service', () => ({
  createEvent: jest.fn().mockImplementation((payload) => Promise.resolve({
    id: 'uuid-1',
    title: payload.title,
    description: payload.description ?? null,
    eventDate: payload.eventDate,
    budget: payload.budget ?? null,
    ownerId: payload.ownerId, // Changed
    createdAt: new Date(),
  })),
  findEventById: jest.fn(),
  updateEvent: jest.fn().mockImplementation((id, payload) => Promise.resolve({
    ...mockEvent,
    ...payload,
    id,
  })),
  createInvitation: jest.fn().mockImplementation((eventId, email) => Promise.resolve({
    id: 'invit-1',
    event_id: eventId,
    email: email,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
  })),
  joinEvent: jest.fn(),
  performDraw: jest.fn(),
  getAssignment: jest.fn(),
}));

const eventService = require('../../services/event.service');

describe('POST /api/events', () => {
  it('should create an event when authenticated', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Promo Event',
        eventDate: new Date(Date.now() + 3600 * 1000).toISOString(),
        // ownerEmail removd from payload
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.ownerId).toBe(1);
  });

  it('should return 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: '' }) // ownerEmail removed
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/events/:id/invite', () => {
  it('should invite a user successfully', async () => {
    const res = await request(app)
      .post('/api/events/uuid-1/invite')
      .send({ email: 'guest@example.com' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'invit-1');
    expect(res.body.email).toBe('guest@example.com');
  });

  it('should return 400 if email is invalid', async () => {
    const res = await request(app)
      .post('/api/events/uuid-1/invite')
      .send({ email: 'invalid-email' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email invalide');
  });
});

describe('PATCH /api/events/:id', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
  });

  it('should update an event successfully', async () => {
    (eventService.findEventById as jest.Mock).mockResolvedValue(mockEvent);

    const res = await request(app)
      .put(`/api/events/${mockEvent.id}`) // Changed from PATCH to PUT based on routes
      .send({ title: 'New Event Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(eventService.updateEvent).toHaveBeenCalledWith(mockEvent.id, { title: 'New Event Title' });
    expect(res.body.data.title).toBe('New Event Title');
  });

  it('should return 404 if event not found', async () => {
    (eventService.findEventById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/events/non-existent-id')
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Événement non trouvé.');
  });

  it('should return 403 if user is not the owner', async () => {
    const otherUserEvent = { ...mockEvent, ownerId: 999 }; // Changed to ownerId
    (eventService.findEventById as jest.Mock).mockResolvedValue(otherUserEvent);

    const res = await request(app)
      .put(`/api/events/${mockEvent.id}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Vous n\'êtes pas autorisé à modifier cet événement.');
  });

  it('should return 400 for invalid data', async () => {
    const res = await request(app)
      .put(`/api/events/${mockEvent.id}`)
      .send({ budget: -50 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});
