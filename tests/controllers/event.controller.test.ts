import { Request, Response } from 'express';
import { createEventHandler } from '../../src/controllers/event.controller';
import * as eventService from '../../src/services/event.service';

jest.mock('../../src/services/event.service');

describe('createEventHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    // Injecter user.id pour l'authentification
    mockReq = {
      body: {},
      user: { id: 1, email: 'test@example.com' }
    } as any;

    mockRes = { status: statusMock, json: jsonMock } as any;

    jest.clearAllMocks();
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
    (eventService.createEvent as jest.Mock).mockResolvedValue(createdEvent);

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
