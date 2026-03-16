import { vi, type Mock } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import * as eventService from '../../src/services/event.service';

// Mock du middleware authenticate pour bypasser la vérification JWT en tests
vi.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    // Injecter un user complet comme le fait le middleware
    req.user = { id: 1, email: 'test@example.com' };
    next();
  }
}));

// Mock du service email pour éviter les erreurs de connexion SMTP
vi.mock('../../src/services/email.service', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
  sendDrawResultEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock du service notification pour éviter les appels BDD
vi.mock('../../src/services/notification.service', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock de la couche service pour ne pas toucher la BDD
const mockEvent = {
  id: 'event-uuid-123',
  title: 'Original Title',
  description: 'Original Description',
  eventDate: new Date(),
  budget: 20,
  ownerId: 1,
  createdAt: new Date(),
};

const mockInvitation = {
  id: 'invit-1',
  event_id: 'event-uuid-123',
  email: 'guest@example.com',
  status: 'pending',
  user_id: null,
  username: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockParticipant = {
  id: 2,
  username: 'participant1',
  email: 'participant@example.com',
};

const mockAssignment = {
  id: 'assign-1',
  event_id: 'event-uuid-123',
  giver_id: 1,
  receiver_id: 2,
};

vi.mock('../../src/services/event.service', () => ({
  createEvent: vi.fn().mockImplementation((payload) => Promise.resolve({
    id: 'uuid-1',
    title: payload.title,
    description: payload.description ?? null,
    eventDate: payload.eventDate,
    budget: payload.budget ?? null,
    ownerId: payload.ownerId,
    createdAt: new Date(),
  })),
  findEventById: vi.fn(),
  updateEvent: vi.fn().mockImplementation((id, payload) => Promise.resolve({
    ...mockEvent,
    ...payload,
    id,
  })),
  deleteEvent: vi.fn().mockResolvedValue(true),
  createInvitation: vi.fn().mockImplementation((eventId, email) => Promise.resolve({
    id: 'invit-1',
    event_id: eventId,
    email: email,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
  })),
  getEventInvitations: vi.fn(),
  findInvitationById: vi.fn(),
  deleteInvitation: vi.fn().mockResolvedValue(true),
  joinEvent: vi.fn(),
  performDraw: vi.fn().mockResolvedValue({ assignments: [], notifications: [] }),
  getAssignment: vi.fn(),
  getEventsByUserId: vi.fn(),
  getEventParticipants: vi.fn(),
}));

describe('POST /api/events', () => {
  it('should create an event when authenticated', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Promo Event',
        eventDate: new Date(Date.now() + 3600 * 1000).toISOString(),
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
      .send({ title: '' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user events', async () => {
    (eventService.getEventsByUserId as Mock).mockResolvedValue([mockEvent]);

    const res = await request(app)
      .get('/api/events')
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(eventService.getEventsByUserId).toHaveBeenCalledWith(1);
  });
});

describe('GET /api/events/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return event details', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);

    const res = await request(app)
      .get(`/api/events/${mockEvent.id}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(mockEvent.id);
  });

  it('should return 404 if event not found', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/events/non-existent-id')
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Événement non trouvé.');
  });
});

describe('PUT /api/events/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update an event successfully', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);

    const res = await request(app)
      .put(`/api/events/${mockEvent.id}`)
      .send({ title: 'New Event Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(eventService.updateEvent).toHaveBeenCalledWith(mockEvent.id, { title: 'New Event Title' });
    expect(res.body.data.title).toBe('New Event Title');
  });

  it('should return 404 if event not found', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/events/non-existent-id')
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Événement non trouvé.');
  });

  it('should return 403 if user is not the owner', async () => {
    const otherUserEvent = { ...mockEvent, ownerId: 999 };
    (eventService.findEventById as Mock).mockResolvedValue(otherUserEvent);

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

describe('DELETE /api/events/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an event successfully', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);

    const res = await request(app)
      .delete(`/api/events/${mockEvent.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Événement supprimé avec succès.');
    expect(eventService.deleteEvent).toHaveBeenCalledWith(mockEvent.id);
  });

  it('should return 404 if event not found', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/events/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Événement non trouvé.');
  });

  it('should return 403 if user is not the owner', async () => {
    const otherUserEvent = { ...mockEvent, ownerId: 999 };
    (eventService.findEventById as Mock).mockResolvedValue(otherUserEvent);

    const res = await request(app)
      .delete(`/api/events/${mockEvent.id}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Vous n\'êtes pas autorisé à supprimer cet événement.');
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

describe('GET /api/events/:id/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return invitations list for owner', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);
    (eventService.getEventInvitations as Mock).mockResolvedValue([mockInvitation]);

    const res = await request(app)
      .get(`/api/events/${mockEvent.id}/invitations`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].email).toBe('guest@example.com');
  });

  it('should return 403 if user is not the owner', async () => {
    const otherUserEvent = { ...mockEvent, ownerId: 999 };
    (eventService.findEventById as Mock).mockResolvedValue(otherUserEvent);

    const res = await request(app)
      .get(`/api/events/${mockEvent.id}/invitations`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(403);
  });

  it('should return 404 if event not found', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/events/non-existent/invitations')
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/events/:id/invitations/:invitationId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a pending invitation successfully', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);
    (eventService.findInvitationById as Mock).mockResolvedValue(mockInvitation);

    const res = await request(app)
      .delete(`/api/events/${mockEvent.id}/invitations/${mockInvitation.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Invitation annulée avec succès.');
  });

  it('should return 400 if invitation is already accepted', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);
    (eventService.findInvitationById as Mock).mockResolvedValue({
      ...mockInvitation,
      status: 'accepted',
    });

    const res = await request(app)
      .delete(`/api/events/${mockEvent.id}/invitations/${mockInvitation.id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Impossible d\'annuler une invitation déjà acceptée.');
  });

  it('should return 403 if user is not the owner', async () => {
    const otherUserEvent = { ...mockEvent, ownerId: 999 };
    (eventService.findEventById as Mock).mockResolvedValue(otherUserEvent);

    const res = await request(app)
      .delete(`/api/events/${mockEvent.id}/invitations/${mockInvitation.id}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 if invitation not found', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);
    (eventService.findInvitationById as Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/events/${mockEvent.id}/invitations/non-existent`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Invitation non trouvée.');
  });
});

describe('GET /api/events/:id/participants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return participants list', async () => {
    (eventService.getEventParticipants as Mock).mockResolvedValue([mockParticipant]);

    const res = await request(app)
      .get(`/api/events/${mockEvent.id}/participants`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/events/:id/join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should join an event successfully', async () => {
    (eventService.joinEvent as Mock).mockResolvedValue({ success: true, message: 'Vous avez rejoint l\'événement avec succès !' });

    const res = await request(app)
      .post(`/api/events/${mockEvent.id}/join`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 400 if no invitation found', async () => {
    (eventService.joinEvent as Mock).mockResolvedValue({ success: false, message: 'Aucune invitation trouvée pour cet événement.' });

    const res = await request(app)
      .post(`/api/events/${mockEvent.id}/join`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/events/:id/draw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform draw successfully', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(mockEvent);
    (eventService.performDraw as Mock).mockResolvedValue({
      assignments: [mockAssignment],
      notifications: [
        {
          giverId: 1,
          giverEmail: 'test@example.com',
          giverUsername: 'test',
          receiverUsername: 'participant1',
          eventTitle: 'Original Title',
        },
      ],
    });

    const res = await request(app)
      .post(`/api/events/${mockEvent.id}/draw`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tirage effectué avec succès !');
    expect(res.body.count).toBe(1);
  });

  it('should return 403 if user is not the owner', async () => {
    const otherUserEvent = { ...mockEvent, ownerId: 999 };
    (eventService.findEventById as Mock).mockResolvedValue(otherUserEvent);

    const res = await request(app)
      .post(`/api/events/${mockEvent.id}/draw`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Seul l\'organisateur peut lancer le tirage au sort.');
  });

  it('should return 404 if event not found', async () => {
    (eventService.findEventById as Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/events/non-existent/draw');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/events/:id/my-assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user assignment', async () => {
    (eventService.getAssignment as Mock).mockResolvedValue(mockAssignment);

    const res = await request(app)
      .get(`/api/events/${mockEvent.id}/my-assignment`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.receiverId).toBe(2);
  });

  it('should return 404 if no assignment found', async () => {
    (eventService.getAssignment as Mock).mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/events/${mockEvent.id}/my-assignment`);

    expect(res.status).toBe(404);
  });
});

