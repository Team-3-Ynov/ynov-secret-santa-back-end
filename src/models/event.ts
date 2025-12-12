// Types et helpers liés aux évènements Secret Santa
export interface EventInput {
  title: string;
  description?: string;
  eventDate: string;
  budget?: number;
  ownerEmail: string;
}

export interface NormalizedEventInput {
  title: string;
  description?: string;
  eventDate: Date;
  budget?: number;
  ownerEmail: string;
}

export interface EventRecord extends NormalizedEventInput {
  id: string;
  createdAt: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEventInput = (payload: Partial<EventInput>) => {
  const errors: string[] = [];

  const title = payload.title?.trim();
  if (!title) {
    errors.push('Le titre est requis.');
  }

  const ownerEmail = payload.ownerEmail?.trim().toLowerCase();
  if (!ownerEmail || !EMAIL_REGEX.test(ownerEmail)) {
    errors.push('Un email propriétaire valide est requis.');
  }

  let eventDate: Date | undefined;
  if (!payload.eventDate) {
    errors.push('La date de l\'évènement est requise.');
  } else {
    const parsedDate = new Date(payload.eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('La date de l\'évènement doit être au format ISO.');
    } else if (parsedDate.getTime() < Date.now()) {
      errors.push('La date de l\'évènement doit être dans le futur.');
    } else {
      eventDate = parsedDate;
    }
  }

  let budget: number | undefined;
  if (payload.budget !== undefined) {
    const numericBudget = Number(payload.budget);
    if (Number.isNaN(numericBudget) || numericBudget < 0) {
      errors.push('Le budget doit être un nombre positif.');
    } else {
      budget = numericBudget;
    }
  }

  if (errors.length > 0 || !title || !ownerEmail || !eventDate) {
    return { errors } as const;
  }

  const normalized: NormalizedEventInput = {
    title,
    description: payload.description?.trim() || undefined,
    eventDate,
    budget,
    ownerEmail,
  };

  return { data: normalized } as const;
};

