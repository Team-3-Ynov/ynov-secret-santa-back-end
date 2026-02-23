import { createEvent, createInvitation, joinEvent, findEventById, deleteEvent, updateEvent, performDraw, getAssignment, getEventsByUserId, getEventParticipants, getEventInvitations, findInvitationById, deleteInvitation, addExclusion, getEventExclusions, deleteExclusion } from '../../src/services/event.service';

describe('EventService - Unified Dependency Injection Tests', () => {
    let mockPool: any;
    let mockClientQuery: jest.Mock;
    let mockClientRelease: jest.Mock;
    let mockPoolQuery: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClientQuery = jest.fn();
        mockClientRelease = jest.fn();
        mockPoolQuery = jest.fn();

        mockPool = {
            query: mockPoolQuery,
            connect: jest.fn(() => Promise.resolve({
                query: mockClientQuery,
                release: mockClientRelease,
            })),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createEvent', () => {
        it('should create an event successfully', async () => {
            const mockEvent = { id: 'uuid', title: 'Test' };
            mockPoolQuery.mockResolvedValueOnce({ rows: [mockEvent] });

            const result = await createEvent({ title: 'Test', eventDate: new Date(), ownerId: 1 } as any, mockPool);

            expect(result).toEqual(mockEvent);
            expect(mockPoolQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO events'), expect.any(Array));
        });
    });

    describe('createInvitation', () => {
        it('should create a new invitation', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Existing check
            mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'inv-1' }] }); // Insertion

            const result = await createInvitation('event-1', 'test@test.com', mockPool);

            expect(result.id).toBe('inv-1');
            expect(mockPoolQuery).toHaveBeenCalledTimes(2);
        });
    });

    describe('joinEvent', () => {
        it('should successfully join an event', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'inv-1', status: 'pending' }] }); // Find invitation
            mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 }); // Update invitation

            const result = await joinEvent('event-1', 1, 'test@test.com', mockPool);

            expect(result.success).toBe(true);
            expect(mockPoolQuery).toHaveBeenCalledTimes(2);
        });
    });

    describe('findEventById', () => {
        it('should return an event by id', async () => {
            const mockEvent = { id: 'event-1' };
            mockPoolQuery.mockResolvedValueOnce({ rows: [mockEvent] });

            const result = await findEventById('event-1', mockPool);

            expect(result).toEqual(mockEvent);
        });
    });

    describe('deleteEvent', () => {
        it('should delete an event and its related data', async () => {
            mockClientQuery
                .mockResolvedValueOnce({ command: 'BEGIN' })
                .mockResolvedValueOnce({}) // Delete assignments
                .mockResolvedValueOnce({}) // Delete invitations
                .mockResolvedValueOnce({ rowCount: 1 }) // Delete event
                .mockResolvedValueOnce({ command: 'COMMIT' });

            const result = await deleteEvent('event-1', mockPool);

            expect(result).toBe(true);
            expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
        });
    });

    describe('updateEvent', () => {
        it('should update an event', async () => {
            const updatedEvent = { id: 'event-1', title: 'New Title' };
            mockPoolQuery.mockResolvedValueOnce({ rows: [updatedEvent] });

            const result = await updateEvent('event-1', { title: 'New Title' }, mockPool);

            expect(result).toEqual(updatedEvent);
        });
    });

    describe('performDraw', () => {
        it('should perform a draw successfully', async () => {
            mockClientQuery
                .mockResolvedValueOnce({ command: 'BEGIN' })
                .mockResolvedValueOnce({ rows: [{ user_id: 1 }, { user_id: 2 }], rowCount: 2 }) // participants
                .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing draw
                .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // exclusions
                .mockResolvedValueOnce({ rows: [{ giver_id: 1, receiver_id: 2 }], rowCount: 1 }) // insert 1
                .mockResolvedValueOnce({ rows: [{ giver_id: 2, receiver_id: 1 }], rowCount: 1 }) // insert 2
                .mockResolvedValueOnce({ command: 'COMMIT' });

            const result = await performDraw('event-1', mockPool);

            expect(result).toHaveLength(2);
            expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
        });

        it('should perform a draw while respecting exclusions', async () => {
            // Participants: 1, 2, 3
            // Exclusion: giver 1 cannot draw receiver 2
            mockClientQuery
                .mockResolvedValueOnce({ command: 'BEGIN' })
                .mockResolvedValueOnce({
                    rows: [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }],
                    rowCount: 3,
                }) // participants
                .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing draw
                .mockResolvedValueOnce({
                    rows: [{ giver_id: 1, receiver_id: 2 }],
                    rowCount: 1,
                }) // exclusions
                // Inserted assignments (none should match the excluded pair 1 -> 2)
                .mockResolvedValueOnce({
                    rows: [{ giver_id: 1, receiver_id: 3 }],
                    rowCount: 1,
                }) // insert 1
                .mockResolvedValueOnce({
                    rows: [{ giver_id: 2, receiver_id: 1 }],
                    rowCount: 1,
                }) // insert 2
                .mockResolvedValueOnce({
                    rows: [{ giver_id: 3, receiver_id: 2 }],
                    rowCount: 1,
                }) // insert 3
                .mockResolvedValueOnce({ command: 'COMMIT' });

            const result = await performDraw('event-1', mockPool);

            expect(result).toHaveLength(3);
            // Ensure no assignment matches the excluded pair (1 -> 2)
            const hasExcludedPair = result.some(
                (assignment: { giver_id: number; receiver_id: number }) =>
                    assignment.giver_id === 1 && assignment.receiver_id === 2,
            );
            expect(hasExcludedPair).toBe(false);
            expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
        });

        it('should fail when exclusions make a valid draw impossible', async () => {
            // Participants: 1, 2
            // Exclusions: 1 -> 2 and 2 -> 1 (no valid assignments possible)
            mockClientQuery
                .mockResolvedValueOnce({ command: 'BEGIN' })
                .mockResolvedValueOnce({
                    rows: [{ user_id: 1 }, { user_id: 2 }],
                    rowCount: 2,
                }) // participants
                .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing draw
                .mockResolvedValueOnce({
                    rows: [
                        { giver_id: 1, receiver_id: 2 },
                        { giver_id: 2, receiver_id: 1 },
                    ],
                    rowCount: 2,
                }) // exclusions - impossible to satisfy
                .mockResolvedValueOnce({ command: 'ROLLBACK' });

            await expect(performDraw('event-1', mockPool)).rejects.toThrow();
            expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('getAssignment', () => {
        it('should return an assignment', async () => {
            const mockAssignment = { giver_id: 1, receiver_id: 2 };
            mockPoolQuery.mockResolvedValueOnce({ rows: [mockAssignment] });

            const result = await getAssignment('event-1', 1, mockPool);

            expect(result).toEqual(mockAssignment);
        });
    });

    describe('getEventsByUserId', () => {
        it('should return events for a user', async () => {
            const mockEvents = [{ id: 'event-1' }];
            mockPoolQuery.mockResolvedValueOnce({ rows: mockEvents });

            const result = await getEventsByUserId(1, mockPool);

            expect(result).toEqual(mockEvents);
        });
    });

    describe('getEventParticipants', () => {
        it('should return participants for an event', async () => {
            const mockParticipants = [{ id: 1, username: 'user1' }];
            mockPoolQuery.mockResolvedValueOnce({ rows: mockParticipants });

            const result = await getEventParticipants('event-1', mockPool);

            expect(result).toEqual(mockParticipants);
        });
    });

    describe('getEventInvitations', () => {
        it('should return invitations for an event', async () => {
            const mockInvitations = [{ id: 'inv-1', email: 'test@test.com' }];
            mockPoolQuery.mockResolvedValueOnce({ rows: mockInvitations });

            const result = await getEventInvitations('event-1', mockPool);

            expect(result).toEqual(mockInvitations);
        });
    });

    describe('findInvitationById', () => {
        it('should return an invitation by id', async () => {
            const mockInvitation = { id: 'inv-1' };
            mockPoolQuery.mockResolvedValueOnce({ rows: [mockInvitation] });

            const result = await findInvitationById('inv-1', mockPool);

            expect(result).toEqual(mockInvitation);
        });
    });

    describe('deleteInvitation', () => {
        it('should delete an invitation', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

            const result = await deleteInvitation('inv-1', mockPool);

            expect(result).toBe(true);
        });
    });

    describe('addExclusion', () => {
        it('should add an exclusion', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }, { user_id: 2 }], rowCount: 2 }); // participants check
            mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 1, event_id: 'event-1', giver_id: 1, receiver_id: 2 }] }); // insertion

            const result = await addExclusion('event-1', 1, 2, mockPool);

            expect(result.giver_id).toBe(1);
            expect(mockPoolQuery).toHaveBeenCalledTimes(2);
        });
    });

    describe('getEventExclusions', () => {
        it('should return exclusions for an event', async () => {
            const mockExclusions = [{ id: 1, giver_id: 1, receiver_id: 2 }];
            mockPoolQuery.mockResolvedValueOnce({ rows: mockExclusions });

            const result = await getEventExclusions('event-1', mockPool);

            expect(result).toEqual(mockExclusions);
        });
    });

    describe('deleteExclusion', () => {
        it('should delete an exclusion', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

            const result = await deleteExclusion('event-1', 1, mockPool);

            expect(result).toBe(true);
        });
    });
});
