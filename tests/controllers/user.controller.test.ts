import { Request, Response } from 'express';
import {
  getPublicProfileHandler,
  getMeHandler,
  updateProfileHandler,
  updatePasswordHandler,
} from '../../src/controllers/user.controller';
import { UserModel } from '../../src/models/user.model';
import * as userService from '../../src/services/user.service';

jest.mock('../../src/models/user.model');
jest.mock('../../src/services/user.service');

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = { body: {}, params: {} };
    mockResponse = { status: statusMock, json: jsonMock };

    jest.clearAllMocks();
  });

  describe('getPublicProfileHandler', () => {
    it('should return a public profile when user exists', async () => {
      const mockProfile = { id: 2, username: 'john_doe', created_at: new Date() };
      mockRequest.params = { id: '2' };
      (userService.getPublicUserProfile as jest.Mock).mockResolvedValue(mockProfile);

      await getPublicProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(userService.getPublicUserProfile).toHaveBeenCalledWith(2);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockProfile });
    });

    it('should return 400 when id is not a number', async () => {
      mockRequest.params = { id: 'abc' };

      await getPublicProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'ID utilisateur invalide.' });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: '999' };
      (userService.getPublicUserProfile as jest.Mock).mockResolvedValue(null);

      await getPublicProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Utilisateur non trouvé.' });
    });

    it('should return 500 on unexpected error', async () => {
      mockRequest.params = { id: '1' };
      (userService.getPublicUserProfile as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await getPublicProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Erreur serveur' });
    });
  });

  describe('getMeHandler', () => {
    it('should return current user profile', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser', created_at: new Date(), updated_at: new Date() };
      mockRequest = { ...mockRequest, user: { id: 1, email: 'test@example.com' } } as any;
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await getMeHandler(mockRequest as Request, mockResponse as Response);

      expect(UserModel.findById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: { user: mockUser } });
    });

    it('should return 404 when user not found in DB', async () => {
      mockRequest = { ...mockRequest, user: { id: 999, email: 'unknown@example.com' } } as any;
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await getMeHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Utilisateur non trouvé.' });
    });

    it('should return 500 on unexpected error', async () => {
      mockRequest = { ...mockRequest, user: { id: 1, email: 'test@example.com' } } as any;
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await getMeHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Erreur serveur' });
    });
  });

  describe('updateProfileHandler', () => {
    it('should update profile successfully', async () => {
      const updatedUser = { id: 1, email: 'test@example.com', username: 'new_username', created_at: new Date(), updated_at: new Date() };
      mockRequest = { ...mockRequest, body: { username: 'new_username' }, user: { id: 1, email: 'test@example.com' } } as any;
      (userService.updateUserProfile as jest.Mock).mockResolvedValue({ success: true, user: updatedUser });

      await updateProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(userService.updateUserProfile).toHaveBeenCalledWith(1, { username: 'new_username' });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { user: updatedUser },
      });
    });

    it('should return 400 when update fails due to conflict', async () => {
      mockRequest = { ...mockRequest, body: { email: 'taken@example.com' }, user: { id: 1, email: 'test@example.com' } } as any;
      (userService.updateUserProfile as jest.Mock).mockResolvedValue({ success: false, error: 'Cet email est déjà utilisé par un autre compte' });

      await updateProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Cet email est déjà utilisé par un autre compte' });
    });

    it('should return 500 on unexpected error', async () => {
      mockRequest = { ...mockRequest, body: { username: 'test' }, user: { id: 1, email: 'test@example.com' } } as any;
      (userService.updateUserProfile as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await updateProfileHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Erreur serveur' });
    });
  });

  describe('updatePasswordHandler', () => {
    it('should update password successfully', async () => {
      mockRequest = {
        ...mockRequest,
        body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' },
        user: { id: 1, email: 'test@example.com' },
      } as any;
      (userService.updateUserPassword as jest.Mock).mockResolvedValue({ success: true });

      await updatePasswordHandler(mockRequest as Request, mockResponse as Response);

      expect(userService.updateUserPassword).toHaveBeenCalledWith(1, 'OldPass1', 'NewPass1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Mot de passe mis à jour avec succès' });
    });

    it('should return 400 when current password is incorrect', async () => {
      mockRequest = {
        ...mockRequest,
        body: { currentPassword: 'WrongPass', newPassword: 'NewPass1' },
        user: { id: 1, email: 'test@example.com' },
      } as any;
      (userService.updateUserPassword as jest.Mock).mockResolvedValue({ success: false, error: 'Mot de passe actuel incorrect' });

      await updatePasswordHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Mot de passe actuel incorrect' });
    });

    it('should return 500 on unexpected error', async () => {
      mockRequest = {
        ...mockRequest,
        body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' },
        user: { id: 1, email: 'test@example.com' },
      } as any;
      (userService.updateUserPassword as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await updatePasswordHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Erreur serveur' });
    });
  });
});
