import { pool } from '../config/database';
import { EventRecord, NormalizedEventInput, UpdateEventInput } from '../models/event.model';
import { InvitationRecord } from '../models/invitation.model';
import { AssignmentRecord } from '../models/assignment.model';
import { Exclusion } from '../models/exclusion.model';
import { randomUUID } from 'crypto';

export const createEvent = async (payload: NormalizedEventInput, clientPool: typeof pool = pool): Promise<EventRecord> => {
  const id = randomUUID();
  const createdAt = new Date();

  const result = await clientPool.query<EventRecord>(
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

export const createInvitation = async (eventId: string, email: string, clientPool: typeof pool = pool): Promise<InvitationRecord> => {
  const id = randomUUID();

  // Vérifier si l'invitation existe déjà
  const existing = await clientPool.query(
    'SELECT * FROM invitations WHERE event_id = $1 AND email = $2',
    [eventId, email]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await clientPool.query<InvitationRecord>(
    `INSERT INTO invitations (id, event_id, email, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [id, eventId, email]
  );

  return result.rows[0];
};

export const joinEvent = async (eventId: string, userId: number, email: string, clientPool: typeof pool = pool): Promise<{ success: boolean; message: string }> => {
  // Vérifier si une invitation existe pour cet email
  const invitationResult = await clientPool.query<InvitationRecord>(
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
  await clientPool.query(
    `UPDATE invitations 
     SET status = 'accepted', user_id = $1, updated_at = NOW() 
     WHERE id = $2`,
    [userId, invitation.id]
  );

  return { success: true, message: 'Vous avez rejoint l\'événement avec succès !' };
};

export const findEventById = async (id: string, clientPool: typeof pool = pool): Promise<EventRecord | null> => {
  const result = await clientPool.query<EventRecord>(
    'SELECT id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt" FROM events WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
};

export const deleteEvent = async (id: string, clientPool: typeof pool = pool): Promise<boolean> => {
  const client = await clientPool.connect();
  try {
    await client.query('BEGIN');

    // Supprimer les assignations liées
    await client.query('DELETE FROM assignments WHERE event_id = $1', [id]);

    // Supprimer les invitations liées
    await client.query('DELETE FROM invitations WHERE event_id = $1', [id]);

    // Supprimer l'événement
    const result = await client.query('DELETE FROM events WHERE id = $1', [id]);

    await client.query('COMMIT');
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateEvent = async (id: string, payload: Partial<UpdateEventInput>, clientPool: typeof pool = pool): Promise<EventRecord | null> => {
  const setClauses = Object.keys(payload).map((key, index) => {
    const dbKey = key === 'eventDate' ? 'event_date' : key;
    return `${dbKey} = $${index + 2}`;
  });

  if (setClauses.length === 0) {
    return findEventById(id, clientPool);
  }

  const query = `
    UPDATE events
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt"
  `;

  const values = [id, ...Object.values(payload)];

  const result = await clientPool.query<EventRecord>(query, values);
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

export const performDraw = async (eventId: string, clientPool: typeof pool = pool): Promise<AssignmentRecord[]> => {
  const client = await clientPool.connect(); // Use the passed pool or default
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

    // 3. Récupérer les exclusions
    const exclusionsResult = await client.query<{ giver_id: number; receiver_id: number }>(
      'SELECT giver_id, receiver_id FROM event_exclusions WHERE event_id = $1',
      [eventId]
    );
    const exclusions = new Map<number, number[]>();
    for (const ex of exclusionsResult.rows) {
      if (!exclusions.has(ex.giver_id)) {
        exclusions.set(ex.giver_id, []);
      }
      exclusions.get(ex.giver_id)!.push(ex.receiver_id);
    }

    // 4. Tenter de trouver une assignation valide avec un algorithme de backtracking
    const assignments = findValidAssignment(participants, exclusions);

    if (!assignments) {
      throw new Error('Impossible de trouver une assignation valide avec les exclusions actuelles. Trop de contraintes.');
    }

    // 5. Sauvegarder les assignations
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

function findValidAssignment(
  participants: number[],
  exclusions: Map<number, number[]>
): { giver: number; receiver: number }[] | null {
  const givers = shuffle(participants);
  const receivers = new Set(participants);
  const assignments: { giver: number; receiver: number }[] = [];

  function backtrack(giverIndex: number): boolean {
    if (giverIndex === givers.length) {
      // Cas de base: tous les donneurs sont assignés
      // Il faut vérifier que le dernier assigné ne crée pas un cycle court non souhaité
      // et que l'assignation est un dérangement complet (personne ne se tire soi-même)
      // ce qui est déjà géré par la logique de sélection des receveurs.
      return true;
    }

    const giver = givers[giverIndex];
    const possibleReceivers = shuffle(Array.from(receivers));
    const giverExclusions = exclusions.get(giver) || [];

    for (const receiver of possibleReceivers) {
      if (
        giver !== receiver && // on ne peut pas se donner à soi-même
        !giverExclusions.includes(receiver) // on ne peut pas donner à qqn d'exclu
      ) {
        assignments.push({ giver, receiver });
        receivers.delete(receiver);

        if (backtrack(giverIndex + 1)) {
          return true; // Solution trouvée
        }

        // Backtrack
        assignments.pop();
        receivers.add(receiver);
      }
    }

    return false; // Pas de solution trouvée à partir de ce point
  }

  if (backtrack(0)) {
    return assignments;
  }

  return null; // Aucune solution globale trouvée
}


export const getAssignment = async (eventId: string, userId: number, clientPool: typeof pool = pool): Promise<AssignmentRecord | null> => {
  const result = await clientPool.query<AssignmentRecord>(
    'SELECT * FROM assignments WHERE event_id = $1 AND giver_id = $2',
    [eventId, userId]
  );
  return result.rows[0] || null;
};

export const getEventsByUserId = async (userId: number, clientPool: typeof pool = pool): Promise<EventRecord[]> => {
  const result = await clientPool.query<EventRecord>(
    `SELECT DISTINCT e.id, e.title, e.description, e.event_date AS "eventDate", e.budget, e.owner_id AS "ownerId", e.created_at AS "createdAt"
     FROM events e
     LEFT JOIN invitations i ON e.id = i.event_id
     WHERE e.owner_id = $1 
        OR (i.user_id = $1 AND i.status = 'accepted')
     ORDER BY e.event_date DESC`,
    [userId]
  );
  return result.rows;
};

export interface Participant {
  id: number;
  username: string;
  email: string;
}

export const getEventParticipants = async (eventId: string, clientPool: typeof pool = pool): Promise<Participant[]> => {
  const result = await clientPool.query<Participant>(
    `SELECT u.id, u.username, u.email
     FROM invitations i
     JOIN users u ON i.user_id = u.id
     WHERE i.event_id = $1 AND i.status = 'accepted' AND i.user_id IS NOT NULL
     ORDER BY i.updated_at ASC`,
    [eventId]
  );
  return result.rows;
};

export interface InvitationWithUser {
  id: string;
  event_id: string;
  email: string;
  status: string;
  user_id: number | null;
  username: string | null;
  created_at: Date;
  updated_at: Date;
}

export const getEventInvitations = async (eventId: string, clientPool: typeof pool = pool): Promise<InvitationWithUser[]> => {
  const result = await clientPool.query<InvitationWithUser>(
    `SELECT i.id, i.event_id, i.email, i.status, i.user_id, u.username, i.created_at, i.updated_at
     FROM invitations i
     LEFT JOIN users u ON i.user_id = u.id
     WHERE i.event_id = $1
     ORDER BY i.created_at DESC`,
    [eventId]
  );
  return result.rows;
};

export const findInvitationById = async (invitationId: string, clientPool: typeof pool = pool): Promise<InvitationRecord | null> => {
  const result = await clientPool.query<InvitationRecord>(
    'SELECT * FROM invitations WHERE id = $1',
    [invitationId]
  );
  return result.rows[0] || null;
};

export const deleteInvitation = async (invitationId: string, clientPool: typeof pool = pool): Promise<boolean> => {
  const result = await clientPool.query(
    'DELETE FROM invitations WHERE id = $1',
    [invitationId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const addExclusion = async (eventId: string, giverId: number, receiverId: number, clientPool: typeof pool = pool): Promise<Exclusion> => {
  if (giverId === receiverId) {
    throw new Error('Un utilisateur ne peut pas s\'exclure lui-même.');
  }

  // Vérifier si le donneur et le receveur sont bien des participants acceptés de l'événement
  const participantsCheck = await clientPool.query<{ user_id: number }>(
    "SELECT user_id FROM invitations WHERE event_id = $1 AND user_id IN ($2, $3) AND status = 'accepted'",
    [eventId, giverId, receiverId]
  );

  const foundUserIds = participantsCheck.rows.map(r => r.user_id);
  if (!foundUserIds.includes(giverId)) {
    throw new Error('Le donneur n\'est pas un participant accepté de cet événement.');
  }
  if (!foundUserIds.includes(receiverId)) {
    throw new Error('Le receveur n\'est pas un participant accepté de cet événement.');
  }

  try {
    const result = await clientPool.query<Exclusion>(
      `INSERT INTO event_exclusions (event_id, giver_id, receiver_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [eventId, giverId, receiverId]
    );

    return result.rows[0];
  } catch (error: any) {
    if (error && error.code === '23505') {
      // Contrainte d'unicité violée : cette exclusion existe déjà pour cet événement
      throw new Error('Cette exclusion existe déjà pour cet événement.');
    }
    throw error;
  }
};

export const getEventExclusions = async (eventId: string, clientPool: typeof pool = pool): Promise<Exclusion[]> => {
  const result = await clientPool.query<Exclusion>(
    'SELECT * FROM event_exclusions WHERE event_id = $1',
    [eventId]
  );
  return result.rows;
};

export const deleteExclusion = async (eventId: string, exclusionId: number, clientPool: typeof pool = pool): Promise<boolean> => {
  const result = await clientPool.query(
    'DELETE FROM event_exclusions WHERE id = $1 AND event_id = $2',
    [exclusionId, eventId]
  );
  return (result.rowCount ?? 0) > 0;
};
