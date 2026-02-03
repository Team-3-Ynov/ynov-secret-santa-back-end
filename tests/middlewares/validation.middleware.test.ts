import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  const testSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('should call next() when validation passes', () => {
    mockRequest.body = {
      email: 'test@example.com',
      password: 'password123',
    };

    const middleware = validate(testSchema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 400 when email is invalid', () => {
    mockRequest.body = {
      email: 'invalid-email',
      password: 'password123',
    };

    const middleware = validate(testSchema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Données invalides',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
          }),
        ]),
      })
    );
  });

  it('should return 400 when password is too short', () => {
    mockRequest.body = {
      email: 'test@example.com',
      password: 'short',
    };

    const middleware = validate(testSchema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
          }),
        ]),
      })
    );
  });

  it('should return multiple errors when multiple fields are invalid', () => {
    mockRequest.body = {
      email: 'invalid',
      password: 'short',
    };

    const middleware = validate(testSchema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      })
    );
  });

  it('should return 400 when required field is missing', () => {
    mockRequest.body = {
      email: 'test@example.com',
      // password is missing
    };

    const middleware = validate(testSchema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
  });
});

