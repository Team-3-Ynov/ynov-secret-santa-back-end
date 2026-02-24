import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/middlewares/auth.middleware';
import * as jwtUtils from '../../src/utils/jwt.utils';

jest.mock('../../src/utils/jwt.utils');

describe('authenticate middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should call next() when token is valid', () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' };

    (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
    (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 1, email: 'test@example.com' });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwtUtils.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
    expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect((mockRequest as any).user).toEqual({ id: 1, email: 'test@example.com' });
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing', () => {
    mockRequest.headers = {};

    (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Accès non autorisé : Token manquant',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' };

    (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('invalid-token');
    (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(null);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Accès non autorisé : Token invalide ou expiré',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 when an unexpected error occurs', () => {
    mockRequest.headers = { authorization: 'Bearer some-token' };

    (jwtUtils.extractTokenFromHeader as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Erreur serveur lors de l\'authentification',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
