import { vi, type Mock } from 'vitest';
import { Request, Response } from 'express';
import { createEventHandler, addExclusionHandler, getEventExclusionsHandler, deleteExclusionHandler } from '../../src/controllers/event.controller';
import * as eventService from '../../src/services/event.service';

vi.mock('../../src/services/event.service');

describe('Event Controller - Exclusions', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: Mock;
  let jsonMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      params: { id: 'event-1' },
      body: {},
      user: { id: 1, email: 'owner@example.com' }
    } as any;

    mockRes = { status: statusMock, json: jsonMock } as any;

    vi.clearAllMocks();
  });

  describe('addExclusionHandler', () => {
    it('should return 401 if user not authenticated', async () => {
      (mockReq as any).user = undefined;
      await addExclusionHandler(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 404 if event not found', async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);
      await addExclusionHandler(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 403 if user is not the owner', async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: 'event-1', ownerId: 2 });
      await addExclusionHandler(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should add exclusion and return all exclusions', async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: 'event-1', ownerId: 1 });
      const mockExclusions = [{ id: 1, event_id: 'event-1', giver_id: 1, receiver_id: 2 }];
      (eventService.getEventExclusions as Mock).mockResolvedValue(mockExclusions);

      mockReq.body = { giverId: 1, receiverId: 2 };
      await addExclusionHandler(mockReq as Request, mockRes as Response);

      expect(eventService.addExclusion).toHaveBeenCalledWith('event-1', 1, 2);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockExclusions });
    });
  });

  describe('getEventExclusionsHandler', () => {
    it('should return exclusions if user is owner', async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: 'event-1', ownerId: 1 });
      const mockExclusions = [{ id: 1, event_id: 'event-1', giver_id: 1, receiver_id: 2 }];
      (eventService.getEventExclusions as Mock).mockResolvedValue(mockExclusions);

      await getEventExclusionsHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockExclusions });
    });
  });

  describe('deleteExclusionHandler', () => {
    it('should delete exclusion and return 200', async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: 'event-1', ownerId: 1 });
      (eventService.deleteExclusion as Mock).mockResolvedValue(true);

      mockReq.params = { id: 'event-1', exclusionId: '1' };
      await deleteExclusionHandler(mockReq as Request, mockRes as Response);

      expect(eventService.deleteExclusion).toHaveBeenCalledWith('event-1', 1);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if exclusion not found', async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: 'event-1', ownerId: 1 });
      (eventService.deleteExclusion as Mock).mockResolvedValue(false);

      mockReq.params = { id: 'event-1', exclusionId: '999' };
      await deleteExclusionHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});

describe('createEventHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: Mock;
  let jsonMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    // Injecter user.id pour l'authentification
    mockReq = {
      body: {},
      user: { id: 1, email: 'test@example.com' }
    } as any;

    mockRes = { status: statusMock, json: jsonMock } as any;

    vi.clearAllMocks();
  });

  it('should return 400 on invalid data', async () => {
    mockReq.body = { title: '', eventDate: '' };

    await createEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('should create event and return 201', async () => {
    const createdEvent = {
      id: '1',
      title: 'Test',
      description: null,
      eventDate: new Date(),
      budget: null,
      ownerId: 1,
      createdAt: new Date()
    };
    (eventService.createEvent as Mock).mockResolvedValue(createdEvent);

    mockReq.body = { title: 'Test', eventDate: new Date(Date.now() + 3600 * 1000).toISOString() };

    await createEventHandler(mockReq as Request, mockRes as Response);

    expect(eventService.createEvent).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: createdEvent });
  });

  it('should return 401 if not authenticated', async () => {
    (mockReq as any).user = undefined; // Simulate unauthenticated

    await createEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
  });
});
