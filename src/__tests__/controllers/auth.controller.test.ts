import { Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { UserModel } from '../../models/user.model';
import * as jwtUtils from '../../utils/jwt.utils';

// Mock des dépendances
jest.mock('../../models/user.model');
jest.mock('../../utils/jwt.utils');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
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

    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'Password123',
      username: 'testuser',
    };

    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = validRegistrationData;
      
      (UserModel.emailExists as jest.Mock).mockResolvedValue(false);
      (UserModel.usernameExists as jest.Mock).mockResolvedValue(false);
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(UserModel.emailExists).toHaveBeenCalledWith(validRegistrationData.email);
      expect(UserModel.usernameExists).toHaveBeenCalledWith(validRegistrationData.username);
      expect(UserModel.create).toHaveBeenCalledWith({
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        username: validRegistrationData.username,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
        },
      });
    });

    it('should return 409 if email already exists', async () => {
      mockRequest.body = validRegistrationData;
      
      (UserModel.emailExists as jest.Mock).mockResolvedValue(true);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should return 409 if username already exists', async () => {
      mockRequest.body = validRegistrationData;
      
      (UserModel.emailExists as jest.Mock).mockResolvedValue(false);
      (UserModel.usernameExists as jest.Mock).mockResolvedValue(true);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Ce nom d'utilisateur est déjà pris",
      });
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = validRegistrationData;
      
      (UserModel.emailExists as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur lors de l'inscription",
      });
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUserWithoutPassword = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      mockRequest.body = validLoginData;
      
      (UserModel.verifyCredentials as jest.Mock).mockResolvedValue(mockUserWithoutPassword);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(UserModel.verifyCredentials).toHaveBeenCalledWith(validLoginData.email, validLoginData.password);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: mockUserWithoutPassword,
          token: 'mock-jwt-token',
        },
      });
    });

    it('should return 401 if credentials are invalid', async () => {
      mockRequest.body = validLoginData;
      
      (UserModel.verifyCredentials as jest.Mock).mockResolvedValue(null);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = validLoginData;
      
      (UserModel.verifyCredentials as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur lors de la connexion',
      });
    });

    it('should not return password in response', async () => {
      mockRequest.body = validLoginData;
      
      (UserModel.verifyCredentials as jest.Mock).mockResolvedValue(mockUserWithoutPassword);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.user.password).toBeUndefined();
    });
  });

  describe('getMe', () => {
    it('should return user profile when authenticated', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest = { ...mockRequest, userId: 1 } as any;
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await AuthController.getMe(mockRequest as Request, mockResponse as Response);

      expect(UserModel.findById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest = { ...mockRequest, userId: undefined } as any;

      await AuthController.getMe(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Non authentifié',
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest = { ...mockRequest, userId: 999 } as any;
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await AuthController.getMe(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    });
  });
});
