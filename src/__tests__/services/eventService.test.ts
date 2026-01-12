import { createInvitation } from '../../services/eventService';
import { pool } from '../../config/database';

jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn(),
    },
}));

describe('EventService - createInvitation', () => {
    const mockPool = pool as unknown as { query: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return existing invitation if already invited', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 'existing-id', email: 'test@example.com', status: 'pending' }],
            rowCount: 1,
        });

        const result = await createInvitation('event-1', 'test@example.com');

        expect(mockPool.query).toHaveBeenCalledTimes(1);
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM invitations'),
            ['event-1', 'test@example.com']
        );
        expect(result.id).toBe('existing-id');
    });

    it('should create new invitation if not exists', async () => {
        // First query returns empty (does not exist)
        mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        // Second query returns created invitation
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 'new-id', email: 'test@example.com', status: 'pending' }],
            rowCount: 1,
        });

        const result = await createInvitation('event-1', 'test@example.com');

        expect(mockPool.query).toHaveBeenCalledTimes(2);
        // Check insert query
        expect(mockPool.query).toHaveBeenLastCalledWith(
            expect.stringContaining('INSERT INTO invitations'),
            expect.any(Array)
        );
        expect(result.id).toBe('new-id');
    });
});
