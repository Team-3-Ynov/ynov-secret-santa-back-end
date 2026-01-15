import { pool } from '../config/database';
import { EventRecord, NormalizedEventInput, UpdateEventInput } from '../models/event.model';
import { InvitationRecord } from '../models/invitation.model';
import { AssignmentRecord } from '../models/assignment.model';
import { randomUUID } from 'crypto';

export const createEvent = async (payload: NormalizedEventInput): Promise<EventRecord> => {
  const id = randomUUID();
  const createdAt = new Date();

  const result = await pool.query<EventRecord>(
    `INSERT INTO events (id, title, description, event_date, budget, owner_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt"`,
    [
      id,
      payload.title,
      payload.description ?? null,
      payload.eventDate.toISOString(),
      payload.budget ?? null,
      payload.ownerId,
      createdAt.toISOString(),
    ],
  );

  return result.rows[0];
};

export const createInvitation = async (eventId: string, email: string): Promise<InvitationRecord> => {
  const id = randomUUID();

  // Vérifier si l'invitation existe déjà
  const existing = await pool.query(
    'SELECT * FROM invitations WHERE event_id = $1 AND email = $2',
    [eventId, email]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await pool.query<InvitationRecord>(
    `INSERT INTO invitations (id, event_id, email, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [id, eventId, email]
  );

  return result.rows[0];
};

export const joinEvent = async (eventId: string, userId: number, email: string): Promise<{ success: boolean; message: string }> => {
  // Vérifier si une invitation existe pour cet email
  const invitationResult = await pool.query<InvitationRecord>(
    'SELECT * FROM invitations WHERE event_id = $1 AND email = $2',
    [eventId, email]
  );

  if (invitationResult.rows.length === 0) {
    // Optionnel : permettre de rejoindre sans invitation explicite si l'événement est public ? 
    // Pour l'instant on requiert une invitation
    return { success: false, message: 'Aucune invitation trouvée pour cet événement.' };
  }

  const invitation = invitationResult.rows[0];

  if (invitation.status === 'accepted' && invitation.user_id) {
    if (invitation.user_id === userId) {
      return { success: true, message: 'Vous avez déjà rejoint cet événement.' };
    }
    return { success: false, message: 'Cette invitation a déjà été utilisée.' };
  }

  // Mettre à jour l'invitation
  await pool.query(
    `UPDATE invitations 
     SET status = 'accepted', user_id = $1, updated_at = NOW() 
     WHERE id = $2`,
    [userId, invitation.id]
  );

  return { success: true, message: 'Vous avez rejoint l\'événement avec succès !' };
};

export const findEventById = async (id: string): Promise<EventRecord | null> => {
  const result = await pool.query<EventRecord>(
    'SELECT id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt" FROM events WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
};

export const updateEvent = async (id: string, payload: Partial<UpdateEventInput>): Promise<EventRecord | null> => {
  const setClauses = Object.keys(payload).map((key, index) => {
    const dbKey = key === 'eventDate' ? 'event_date' : key;
    return `${dbKey} = $${index + 2}`;
  });

  if (setClauses.length === 0) {
    return findEventById(id);
  }

  const query = `
    UPDATE events
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt"
  `;

  const values = [id, ...Object.values(payload)];

  const result = await pool.query<EventRecord>(query, values);
  return result.rows[0] || null;
};

// Algorithme de mélange de Fisher-Yates
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const performDraw = async (eventId: string): Promise<AssignmentRecord[]> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Récupérer tous les participants acceptés
    const participantsResult = await client.query<{ user_id: number }>(
      `SELECT user_id FROM invitations WHERE event_id = $1 AND status = 'accepted' AND user_id IS NOT NULL`,
      [eventId]
    );

    const participants = participantsResult.rows.map(r => r.user_id);

    if (participants.length < 2) {
      throw new Error('Il faut au moins 2 participants pour effectuer un tirage.');
    }

    // 2. Vérifier si un tirage existe déjà
    const existingDraw = await client.query('SELECT id FROM assignments WHERE event_id = $1 LIMIT 1', [eventId]);
    if (existingDraw.rows.length > 0) {
      throw new Error('Un tirage a déjà été effectué pour cet événement.');
    }

    // 3. Effectuer le tirage (Derangement simple : A->B, B->C, C->A)
    const shuffled = shuffle(participants);
    const assignments: { giver: number; receiver: number }[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length]; // Le dernier donne au premier
      assignments.push({ giver, receiver });
    }

    // 4. Sauvegarder les assignations
    const insertedAssignments: AssignmentRecord[] = [];

    for (const assignment of assignments) {
      const id = randomUUID();
      const res = await client.query<AssignmentRecord>(
        `INSERT INTO assignments (id, event_id, giver_id, receiver_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, eventId, assignment.giver, assignment.receiver]
      );
      insertedAssignments.push(res.rows[0]);
    }

    await client.query('COMMIT');
    return insertedAssignments;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAssignment = async (eventId: string, userId: number): Promise<AssignmentRecord | null> => {
  const result = await pool.query<AssignmentRecord>(
    'SELECT * FROM assignments WHERE event_id = $1 AND giver_id = $2',
    [eventId, userId]
  );
  return result.rows[0] || null;
};
