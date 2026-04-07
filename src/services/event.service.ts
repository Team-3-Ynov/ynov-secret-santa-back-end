import { randomUUID } from "node:crypto";
import { pool } from "../config/database";
import type { AffinityRecord, AffinityValue } from "../models/affinity.model";
import type { AssignmentRecord } from "../models/assignment.model";
import type { EventRecord, NormalizedEventInput, UpdateEventInput } from "../models/event.model";
import type { Exclusion } from "../models/exclusion.model";
import type { InvitationRecord } from "../models/invitation.model";

export const createEvent = async (
  payload: NormalizedEventInput,
  clientPool: typeof pool = pool
): Promise<EventRecord> => {
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
    ]
  );

  return result.rows[0];
};

export const createInvitation = async (
  eventId: string,
  email: string,
  clientPool: typeof pool = pool
): Promise<InvitationRecord> => {
  const id = randomUUID();

  // Vérifier si l'invitation existe déjà
  const existing = await clientPool.query(
    "SELECT * FROM invitations WHERE event_id = $1 AND email = $2",
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

export interface InvitationActionResult {
  success: boolean;
  message: string;
  statusCode?: number;
  invitationId?: string;
}

export const joinEvent = async (
  eventId: string,
  userId: number,
  invitationTokenOrPool?: string | typeof pool,
  clientPool: typeof pool = pool
): Promise<InvitationActionResult> => {
  const invitationToken =
    typeof invitationTokenOrPool === "string" ? invitationTokenOrPool : undefined;
  const resolvedPool =
    typeof invitationTokenOrPool === "string" ? clientPool : invitationTokenOrPool || clientPool;

  // Priorité au token d'invitation quand il est présent.
  // Sinon fallback sur user_id pour les comptes ayant déjà rejoint l'événement.
  const invitationResult = invitationToken
    ? await resolvedPool.query<InvitationRecord>(
        "SELECT * FROM invitations WHERE id = $1 AND event_id = $2",
        [invitationToken, eventId]
      )
    : await resolvedPool.query<InvitationRecord>(
        "SELECT * FROM invitations WHERE event_id = $1 AND user_id = $2",
        [eventId, userId]
      );

  if (invitationResult.rows.length === 0) {
    // Optionnel : permettre de rejoindre sans invitation explicite si l'événement est public ?
    // Pour l'instant on requiert une invitation
    return {
      success: false,
      message: "Aucune invitation trouvée pour cet événement.",
    };
  }

  const invitation = invitationResult.rows[0];

  if (invitation.status === "accepted" && invitation.user_id) {
    if (invitation.user_id === userId) {
      return {
        success: true,
        message: "Vous avez déjà rejoint cet événement.",
      };
    }
    return { success: false, message: "Cette invitation a déjà été utilisée." };
  }

  // Mettre à jour l'invitation
  await resolvedPool.query(
    `UPDATE invitations 
     SET status = 'accepted', user_id = $1, updated_at = NOW() 
     WHERE id = $2`,
    [userId, invitation.id]
  );

  return {
    success: true,
    message: "Vous avez rejoint l'événement avec succès !",
    invitationId: invitation.id,
  };
};

export const declineInvitation = async (
  eventId: string,
  invitationId: string,
  email: string,
  clientPool: typeof pool = pool
): Promise<InvitationActionResult> => {
  const invitationResult = await clientPool.query<InvitationRecord>(
    "SELECT * FROM invitations WHERE id = $1 AND event_id = $2 AND email = $3",
    [invitationId, eventId, email]
  );

  if (invitationResult.rows.length === 0) {
    return { success: false, statusCode: 404, message: "Invitation non trouvée." };
  }

  const invitation = invitationResult.rows[0];

  if (invitation.status === "accepted") {
    return {
      success: false,
      statusCode: 400,
      message: "Impossible de refuser une invitation déjà acceptée.",
    };
  }

  if (invitation.status === "declined") {
    return { success: true, message: "Invitation déjà refusée.", invitationId: invitation.id };
  }

  await clientPool.query(
    `UPDATE invitations
     SET status = 'declined', user_id = NULL, updated_at = NOW()
     WHERE id = $1`,
    [invitation.id]
  );

  return {
    success: true,
    message: "Vous avez rejoint l'événement avec succès !",
  };
};

export const findEventById = async (
  id: string,
  clientPool: typeof pool = pool
): Promise<EventRecord | null> => {
  const result = await clientPool.query<EventRecord>(
    'SELECT id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt" FROM events WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const deleteEvent = async (id: string, clientPool: typeof pool = pool): Promise<boolean> => {
  const client = await clientPool.connect();
  try {
    await client.query("BEGIN");

    // Supprimer les assignations liées
    await client.query("DELETE FROM assignments WHERE event_id = $1", [id]);

    // Supprimer les invitations liées
    await client.query("DELETE FROM invitations WHERE event_id = $1", [id]);

    // Supprimer l'événement
    const result = await client.query("DELETE FROM events WHERE id = $1", [id]);

    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateEvent = async (
  id: string,
  payload: Partial<UpdateEventInput>,
  clientPool: typeof pool = pool
): Promise<EventRecord | null> => {
  const setClauses = Object.keys(payload).map((key, index) => {
    const dbKey = key === "eventDate" ? "event_date" : key;
    return `${dbKey} = $${index + 2}`;
  });

  if (setClauses.length === 0) {
    return findEventById(id, clientPool);
  }

  const query = `
    UPDATE events
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING id, title, description, event_date AS "eventDate", budget, owner_id AS "ownerId", created_at AS "createdAt"
  `;

  const values = [id, ...Object.values(payload)];

  const result = await clientPool.query<EventRecord>(query, values);
  return result.rows[0] || null;
};

export interface DrawNotification {
  giverId: number;
  giverEmail: string;
  giverUsername: string;
  receiverUsername: string;
  eventTitle: string;
}

export interface DrawResult {
  assignments: AssignmentRecord[];
  notifications: DrawNotification[];
  warning?: string;
}

export const performDraw = async (
  eventId: string,
  clientPool: typeof pool = pool
): Promise<DrawResult> => {
  const client = await clientPool.connect();
  try {
    await client.query("BEGIN");

    // 1. Récupérer le titre de l'événement
    const eventResult = await client.query<{ title: string }>(
      "SELECT title FROM events WHERE id = $1",
      [eventId]
    );
    const eventTitle = eventResult.rows[0]?.title ?? "Secret Santa";

    // 2. Récupérer tous les participants acceptés avec leurs infos utilisateur
    const participantsResult = await client.query<{
      user_id: number;
      email: string;
      username: string;
    }>(
      `SELECT i.user_id, u.email, u.username
       FROM invitations i
       JOIN users u ON i.user_id = u.id
       WHERE i.event_id = $1 AND i.status = 'accepted' AND i.user_id IS NOT NULL`,
      [eventId]
    );
    const participants = participantsResult.rows.map((r) => r.user_id);
    const userInfoMap = new Map(
      participantsResult.rows.map((r) => [r.user_id, { email: r.email, username: r.username }])
    );

    if (participants.length < 2) {
      throw new Error("Il faut au moins 2 participants pour effectuer un tirage.");
    }

    // 3. Vérifier si un tirage existe déjà
    const existingDraw = await client.query(
      "SELECT id FROM assignments WHERE event_id = $1 LIMIT 1",
      [eventId]
    );
    if (existingDraw.rows.length > 0) {
      throw new Error("Un tirage a déjà été effectué pour cet événement.");
    }

    // 4. Récupérer les exclusions (contraintes dures)
    const exclusionsResult = await client.query<{
      giver_id: number;
      receiver_id: number;
    }>("SELECT giver_id, receiver_id FROM event_exclusions WHERE event_id = $1", [eventId]);
    const exclusions = new Map<number, number[]>();
    for (const ex of exclusionsResult.rows) {
      if (!exclusions.has(ex.giver_id)) {
        exclusions.set(ex.giver_id, []);
      }
      exclusions.get(ex.giver_id)?.push(ex.receiver_id);
    }

    // 5. Récupérer les affinités
    const affinitiesResult = await client.query<{
      giver_id: number;
      target_id: number;
      affinity: AffinityValue;
    }>("SELECT giver_id, target_id, affinity FROM event_affinities WHERE event_id = $1", [eventId]);
    const affinities = new Map<number, Map<number, AffinityValue>>();
    for (const row of affinitiesResult.rows) {
      if (!affinities.has(row.giver_id)) {
        affinities.set(row.giver_id, new Map());
      }
      affinities.get(row.giver_id)?.set(row.target_id, row.affinity);
    }

    // 6. Trouver une assignation valide (algorithme 3 passes)
    const result = findValidAssignment(participants, exclusions, affinities);

    if (!result) {
      throw new Error(
        "Impossible de trouver une assignation valide avec les exclusions actuelles. Trop de contraintes."
      );
    }

    const { assignments, relaxed } = result;

    // 7. Sauvegarder les assignations et préparer les données de notification
    const insertedAssignments: AssignmentRecord[] = [];
    const notifications: DrawNotification[] = [];

    for (const assignment of assignments) {
      const id = randomUUID();
      const res = await client.query<AssignmentRecord>(
        `INSERT INTO assignments (id, event_id, giver_id, receiver_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, eventId, assignment.giver, assignment.receiver]
      );
      insertedAssignments.push(res.rows[0]);

      const giverInfo = userInfoMap.get(assignment.giver);
      const receiverInfo = userInfoMap.get(assignment.receiver);
      if (giverInfo && receiverInfo) {
        notifications.push({
          giverId: assignment.giver,
          giverEmail: giverInfo.email,
          giverUsername: giverInfo.username,
          receiverUsername: receiverInfo.username,
          eventTitle,
        });
      }
    }

    await client.query("COMMIT");
    return {
      assignments: insertedAssignments,
      notifications,
      ...(relaxed && {
        warning:
          "Certaines préférences 'Éviter' n'ont pas pu être respectées en raison de trop de contraintes.",
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Bipartite matching with affinity support.
 *
 * Pass 1: treat 'avoid' as extra exclusions + prioritise 'favorable' neighbors
 * Pass 2: drop 'avoid' constraints, keep 'favorable' priority (relaxed = true)
 * Pass 3: ignore all affinities, only hard exclusions (last resort)
 */
function findValidAssignment(
  participants: number[],
  exclusions: Map<number, number[]>,
  affinities: Map<number, Map<number, AffinityValue>>
): { assignments: { giver: number; receiver: number }[]; relaxed: boolean } | null {
  const runMatching = (
    extraExclusions: Map<number, Set<number>>,
    priorityMap: Map<number, Set<number>>
  ): { giver: number; receiver: number }[] | null => {
    const n = participants.length;
    if (n === 0) return [];

    const receiverIndex = new Map<number, number>();
    for (let i = 0; i < n; i++) {
      receiverIndex.set(participants[i], i);
    }

    const adjacency: number[][] = new Array(n);
    for (let gi = 0; gi < n; gi++) {
      const giverId = participants[gi];
      const hardExcluded = new Set(exclusions.get(giverId) || []);
      const softExcluded = extraExclusions.get(giverId) ?? new Set<number>();
      const priority = priorityMap.get(giverId) ?? new Set<number>();

      const favNeighbors: number[] = [];
      const normalNeighbors: number[] = [];

      for (let ri = 0; ri < n; ri++) {
        const receiverId = participants[ri];
        if (giverId === receiverId) continue;
        if (hardExcluded.has(receiverId)) continue;
        if (softExcluded.has(receiverId)) continue;

        if (priority.has(receiverId)) {
          favNeighbors.push(ri);
        } else {
          normalNeighbors.push(ri);
        }
      }

      // Favorable neighbors come first to guide the greedy augmentation
      adjacency[gi] = [...favNeighbors, ...normalNeighbors];
    }

    const matchToReceiver: number[] = new Array(n).fill(-1);

    const tryMatch = (giverIndex: number, seen: boolean[]): boolean => {
      for (const receiverIdx of adjacency[giverIndex]) {
        if (seen[receiverIdx]) continue;
        seen[receiverIdx] = true;

        const currentGiver = matchToReceiver[receiverIdx];
        if (currentGiver === -1 || tryMatch(currentGiver, seen)) {
          matchToReceiver[receiverIdx] = giverIndex;
          return true;
        }
      }
      return false;
    };

    for (let gi = 0; gi < n; gi++) {
      const seen: boolean[] = new Array(n).fill(false);
      if (!tryMatch(gi, seen)) return null;
    }

    const assignments: { giver: number; receiver: number }[] = [];
    for (let ri = 0; ri < n; ri++) {
      const gi = matchToReceiver[ri];
      if (gi === -1) return null;
      assignments.push({ giver: participants[gi], receiver: participants[ri] });
    }
    return assignments;
  };

  // Build avoid / favorable sets from affinities
  const avoidMap = new Map<number, Set<number>>();
  const favorableMap = new Map<number, Set<number>>();
  for (const [giverId, targets] of affinities) {
    for (const [targetId, value] of targets) {
      if (value === "avoid") {
        if (!avoidMap.has(giverId)) avoidMap.set(giverId, new Set());
        avoidMap.get(giverId)?.add(targetId);
      } else if (value === "favorable") {
        if (!favorableMap.has(giverId)) favorableMap.set(giverId, new Set());
        favorableMap.get(giverId)?.add(targetId);
      }
    }
  }

  // Pass 1: full affinity constraints (avoid as exclusion + favorable priority)
  const pass1 = runMatching(avoidMap, favorableMap);
  if (pass1) return { assignments: pass1, relaxed: false };

  // Pass 2: drop avoid constraints, keep favorable priority
  const pass2 = runMatching(new Map(), favorableMap);
  if (pass2) return { assignments: pass2, relaxed: true };

  // Pass 3: ignore all affinities
  const pass3 = runMatching(new Map(), new Map());
  if (pass3) return { assignments: pass3, relaxed: true };

  return null;
}

export const getAssignment = async (
  eventId: string,
  userId: number,
  clientPool: typeof pool = pool
): Promise<AssignmentRecord | null> => {
  const result = await clientPool.query<AssignmentRecord>(
    "SELECT * FROM assignments WHERE event_id = $1 AND giver_id = $2",
    [eventId, userId]
  );
  return result.rows[0] || null;
};

export const getEventsByUserId = async (
  userId: number,
  clientPool: typeof pool = pool
): Promise<EventRecord[]> => {
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

export const getEventParticipants = async (
  eventId: string,
  clientPool: typeof pool = pool
): Promise<Participant[]> => {
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

export const getEventInvitations = async (
  eventId: string,
  clientPool: typeof pool = pool
): Promise<InvitationWithUser[]> => {
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

export const findInvitationById = async (
  invitationId: string,
  clientPool: typeof pool = pool
): Promise<InvitationRecord | null> => {
  const result = await clientPool.query<InvitationRecord>(
    "SELECT * FROM invitations WHERE id = $1",
    [invitationId]
  );
  return result.rows[0] || null;
};

export const deleteInvitation = async (
  invitationId: string,
  clientPool: typeof pool = pool
): Promise<boolean> => {
  const result = await clientPool.query("DELETE FROM invitations WHERE id = $1", [invitationId]);
  return (result.rowCount ?? 0) > 0;
};

export const addExclusion = async (
  eventId: string,
  giverId: number,
  receiverId: number,
  clientPool: typeof pool = pool
): Promise<Exclusion> => {
  if (giverId === receiverId) {
    throw new Error("Un utilisateur ne peut pas s'exclure lui-même.");
  }

  // Vérifier si le donneur et le receveur sont bien des participants acceptés de l'événement
  const participantsCheck = await clientPool.query<{ user_id: number }>(
    "SELECT user_id FROM invitations WHERE event_id = $1 AND user_id IN ($2, $3) AND status = 'accepted'",
    [eventId, giverId, receiverId]
  );

  const foundUserIds = participantsCheck.rows.map((r) => r.user_id);
  if (!foundUserIds.includes(giverId)) {
    throw new Error("Le donneur n'est pas un participant accepté de cet événement.");
  }
  if (!foundUserIds.includes(receiverId)) {
    throw new Error("Le receveur n'est pas un participant accepté de cet événement.");
  }

  try {
    const result = await clientPool.query<Exclusion>(
      `INSERT INTO event_exclusions (event_id, giver_id, receiver_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [eventId, giverId, receiverId]
    );

    return result.rows[0];
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "23505"
    ) {
      // Contrainte d'unicité violée : cette exclusion existe déjà pour cet événement
      throw new Error("Cette exclusion existe déjà pour cet événement.");
    }
    throw error;
  }
};

export const getEventExclusions = async (
  eventId: string,
  clientPool: typeof pool = pool
): Promise<Exclusion[]> => {
  const result = await clientPool.query<Exclusion>(
    "SELECT * FROM event_exclusions WHERE event_id = $1",
    [eventId]
  );
  return result.rows;
};

export const deleteExclusion = async (
  eventId: string,
  exclusionId: number,
  clientPool: typeof pool = pool
): Promise<boolean> => {
  const result = await clientPool.query(
    "DELETE FROM event_exclusions WHERE id = $1 AND event_id = $2",
    [exclusionId, eventId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const setAffinity = async (
  eventId: string,
  giverId: number,
  targetId: number,
  affinity: AffinityValue,
  clientPool: typeof pool = pool
): Promise<AffinityRecord> => {
  if (giverId === targetId) {
    throw new Error("Vous ne pouvez pas définir une affinité envers vous-même.");
  }

  // Vérifier que le tirage n'a pas encore été effectué
  const drawCheck = await clientPool.query(
    "SELECT id FROM assignments WHERE event_id = $1 LIMIT 1",
    [eventId]
  );
  if ((drawCheck.rowCount ?? 0) > 0) {
    throw new Error("Le tirage a déjà été effectué. Les affinités ne peuvent plus être modifiées.");
  }

  // Vérifier que les deux utilisateurs sont des participants acceptés
  const participantsCheck = await clientPool.query<{ user_id: number }>(
    "SELECT user_id FROM invitations WHERE event_id = $1 AND user_id IN ($2, $3) AND status = 'accepted'",
    [eventId, giverId, targetId]
  );
  const foundIds = participantsCheck.rows.map((r) => r.user_id);
  if (!foundIds.includes(giverId)) {
    throw new Error("Vous n'êtes pas un participant accepté de cet événement.");
  }
  if (!foundIds.includes(targetId)) {
    throw new Error("Ce participant n'est pas un participant accepté de cet événement.");
  }

  const result = await clientPool.query<AffinityRecord>(
    `INSERT INTO event_affinities (event_id, giver_id, target_id, affinity)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (event_id, giver_id, target_id)
     DO UPDATE SET affinity = EXCLUDED.affinity, updated_at = NOW()
     RETURNING *`,
    [eventId, giverId, targetId, affinity]
  );

  return result.rows[0];
};

export const getAffinities = async (
  eventId: string,
  giverId: number,
  clientPool: typeof pool = pool
): Promise<AffinityRecord[]> => {
  const result = await clientPool.query<AffinityRecord>(
    "SELECT * FROM event_affinities WHERE event_id = $1 AND giver_id = $2",
    [eventId, giverId]
  );
  return result.rows;
};
