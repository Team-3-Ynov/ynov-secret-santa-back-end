import { Request, Response } from 'express';
import { createEventHandler } from '../../controllers/eventController';
import * as eventService from '../../services/eventService';

jest.mock('../../services/eventService');

describe('createEventHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = { body: {} };
    mockRes = { status: statusMock, json: jsonMock } as any;

    jest.clearAllMocks();
  });

  it('should return 400 on invalid data', async () => {
    mockReq.body = { title: '', eventDate: '' };

    await createEventHandler(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('should create event and return 201', async () => {
    const createdEvent = { id: '1', title: 'Test', description: null, eventDate: new Date(), budget: null, ownerEmail: 'test@example.com', createdAt: new Date() };
    (eventService.createEvent as jest.Mock).mockResolvedValue(createdEvent);

    mockReq.body = { title: 'Test', eventDate: new Date(Date.now() + 3600 * 1000).toISOString(), ownerEmail: 'test@example.com' };

    await createEventHandler(mockReq as Request, mockRes as Response);

    expect(eventService.createEvent).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: createdEvent });
  });
});
