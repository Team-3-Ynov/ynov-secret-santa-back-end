import { pool } from '../config/database';
import { EventRecord, NormalizedEventInput } from '../models/event';
import { InvitationRecord } from '../models/invitation.model';
import { randomUUID } from 'crypto';

export const createEvent = async (payload: NormalizedEventInput): Promise<EventRecord> => {
  const id = randomUUID();
  const createdAt = new Date();

  const result = await pool.query<EventRecord>(
    `INSERT INTO events (id, title, description, event_date, budget, owner_email, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, event_date AS "eventDate", budget, owner_email AS "ownerEmail", created_at AS "createdAt"`,
    [
      id,
      payload.title,
      payload.description ?? null,
      payload.eventDate.toISOString(),
      payload.budget ?? null,
      payload.ownerEmail,
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

