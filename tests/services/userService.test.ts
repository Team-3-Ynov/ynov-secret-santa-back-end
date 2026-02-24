import { getPublicUserProfile, getUserStats, updateUserProfile, updateUserPassword } from '../../src/services/user.service';
import { pool } from '../../src/config/database';
import { UserModel } from '../../src/models/user.model';

jest.mock('../../src/config/database', () => ({
    pool: {
        query: jest.fn(),
    },
}));

jest.mock('../../src/models/user.model', () => ({
    UserModel: {
        emailExistsForOtherUser: jest.fn(),
        usernameExistsForOtherUser: jest.fn(),
        update: jest.fn(),
        verifyPassword: jest.fn(),
        updatePassword: jest.fn(),
    },
}));

describe('UserService', () => {
    const mockPool = pool as unknown as { query: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPublicUserProfile', () => {
        it('should return user profile if found', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                first_name: 'Test',
                last_name: 'User',
                created_at: new Date(),
            };
            mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

            const result = await getPublicUserProfile(1);

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id, username, first_name, last_name, created_at FROM users WHERE id = $1'),
                [1]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('getUserStats', () => {
        it('should return user statistics', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{
                    events_created: '5',
                    participations: '3',
                    gifts_offered: '2'
                }]
            });

            const result = await getUserStats(1);

            expect(result).toEqual({
                eventsCreated: 5,
                participations: 3,
                giftsOffered: 2,
            });
        });

        it('should handle user with zero statistics', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{
                    events_created: '0',
                    participations: '0',
                    gifts_offered: '0'
                }]
            });

            const result = await getUserStats(1);

            expect(result).toEqual({
                eventsCreated: 0,
                participations: 0,
                giftsOffered: 0,
            });
        });

        it('should return zeros when no statistics are found', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: []
            });

            const result = await getUserStats(1);

            expect(result).toEqual({
                eventsCreated: 0,
                participations: 0,
                giftsOffered: 0,
            });
        });
    });

    describe('updateUserProfile', () => {
        it('should update profile successfully', async () => {
            (UserModel.emailExistsForOtherUser as jest.Mock).mockResolvedValue(false);
            (UserModel.usernameExistsForOtherUser as jest.Mock).mockResolvedValue(false);
            (UserModel.update as jest.Mock).mockResolvedValue({ id: 1, username: 'newname', email: 'new@test.com' });

            const result = await updateUserProfile(1, { username: 'newname', email: 'new@test.com' });

            expect(result.success).toBe(true);
            expect(result.user?.username).toBe('newname');
        });

        it('should fail if email taken', async () => {
            (UserModel.emailExistsForOtherUser as jest.Mock).mockResolvedValue(true);

            const result = await updateUserProfile(1, { email: 'taken@test.com' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('email');
        });
    });

    describe('updateUserPassword', () => {
        it('should update password successfully', async () => {
            (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
            (UserModel.updatePassword as jest.Mock).mockResolvedValue(true);

            const result = await updateUserPassword(1, 'old', 'new');

            expect(result.success).toBe(true);
        });

        it('should fail if current password incorrect', async () => {
            (UserModel.verifyPassword as jest.Mock).mockResolvedValue(false);

            const result = await updateUserPassword(1, 'wrong', 'new');

            expect(result.success).toBe(false);
            expect(result.error).toContain('incorrect');
        });
    });
});
