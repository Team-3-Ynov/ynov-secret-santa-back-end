import { getPublicUserProfile, getPublicUserProfiles, updateUserProfile, updateUserPassword } from '../../src/services/user.service';
import { UserModel } from '../../src/models/user.model';
import { pool } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/models/user.model');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicUserProfile', () => {
    it('should return a public profile when user exists', async () => {
      const mockProfile = { id: 1, username: 'testuser', created_at: new Date() };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockProfile] });

      const result = await getPublicUserProfile(1);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockProfile);
    });

    it('should return null when user not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getPublicUserProfile(999);

      expect(result).toBeNull();
    });
  });

  describe('getPublicUserProfiles', () => {
    it('should return empty array when no ids provided', async () => {
      const result = await getPublicUserProfiles([]);

      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return profiles for given ids', async () => {
      const mockProfiles = [
        { id: 1, username: 'user1', created_at: new Date() },
        { id: 2, username: 'user2', created_at: new Date() },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockProfiles });

      const result = await getPublicUserProfiles([1, 2]);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, username, created_at FROM users WHERE id = ANY($1)',
        [[1, 2]]
      );
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile successfully', async () => {
      const updatedUser = { id: 1, email: 'new@example.com', username: 'testuser', created_at: new Date(), updated_at: new Date() };
      (UserModel.emailExistsForOtherUser as jest.Mock).mockResolvedValue(false);
      (UserModel.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await updateUserProfile(1, { email: 'new@example.com' });

      expect(UserModel.emailExistsForOtherUser).toHaveBeenCalledWith('new@example.com', 1);
      expect(result).toEqual({ success: true, user: updatedUser });
    });

    it('should return error when email already taken by another user', async () => {
      (UserModel.emailExistsForOtherUser as jest.Mock).mockResolvedValue(true);

      const result = await updateUserProfile(1, { email: 'taken@example.com' });

      expect(result).toEqual({ success: false, error: 'Cet email est déjà utilisé par un autre compte' });
      expect(UserModel.update).not.toHaveBeenCalled();
    });

    it('should return error when username already taken by another user', async () => {
      (UserModel.usernameExistsForOtherUser as jest.Mock).mockResolvedValue(true);

      const result = await updateUserProfile(1, { username: 'taken_user' });

      expect(result).toEqual({ success: false, error: 'Ce nom d\'utilisateur est déjà pris' });
      expect(UserModel.update).not.toHaveBeenCalled();
    });

    it('should return error when user not found during update', async () => {
      (UserModel.usernameExistsForOtherUser as jest.Mock).mockResolvedValue(false);
      (UserModel.update as jest.Mock).mockResolvedValue(null);

      const result = await updateUserProfile(1, { username: 'newname' });

      expect(result).toEqual({ success: false, error: 'Utilisateur non trouvé' });
    });

    it('should update username successfully without checking email', async () => {
      const updatedUser = { id: 1, email: 'test@example.com', username: 'new_username', created_at: new Date(), updated_at: new Date() };
      (UserModel.usernameExistsForOtherUser as jest.Mock).mockResolvedValue(false);
      (UserModel.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await updateUserProfile(1, { username: 'new_username' });

      expect(UserModel.emailExistsForOtherUser).not.toHaveBeenCalled();
      expect(UserModel.usernameExistsForOtherUser).toHaveBeenCalledWith('new_username', 1);
      expect(result).toEqual({ success: true, user: updatedUser });
    });
  });

  describe('updateUserPassword', () => {
    it('should update password successfully', async () => {
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
      (UserModel.updatePassword as jest.Mock).mockResolvedValue(true);

      const result = await updateUserPassword(1, 'currentPass', 'newPass');

      expect(UserModel.verifyPassword).toHaveBeenCalledWith(1, 'currentPass');
      expect(UserModel.updatePassword).toHaveBeenCalledWith(1, 'newPass');
      expect(result).toEqual({ success: true });
    });

    it('should return error when current password is incorrect', async () => {
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await updateUserPassword(1, 'wrongPass', 'newPass');

      expect(result).toEqual({ success: false, error: 'Mot de passe actuel incorrect' });
      expect(UserModel.updatePassword).not.toHaveBeenCalled();
    });

    it('should return error when password update fails', async () => {
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
      (UserModel.updatePassword as jest.Mock).mockResolvedValue(false);

      const result = await updateUserPassword(1, 'currentPass', 'newPass');

      expect(result).toEqual({ success: false, error: 'Erreur lors de la mise à jour du mot de passe' });
    });
  });
});
