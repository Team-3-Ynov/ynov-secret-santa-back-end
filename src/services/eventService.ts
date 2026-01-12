import { pool } from '../config/database';
import { EventRecord, NormalizedEventInput, UpdateEventInput } from '../models/event';
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

export const findEventById = async (id: string): Promise<EventRecord | null> => {
  const result = await pool.query<EventRecord>(
    'SELECT id, title, description, event_date AS "eventDate", budget, owner_email AS "ownerEmail", created_at AS "createdAt" FROM events WHERE id = $1',
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
    RETURNING id, title, description, event_date AS "eventDate", budget, owner_email AS "ownerEmail", created_at AS "createdAt"
  `;

  const values = [id, ...Object.values(payload)];

  const result = await pool.query<EventRecord>(query, values);
  return result.rows[0] || null;
};
