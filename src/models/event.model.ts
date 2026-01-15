// Types et helpers liés aux évènements Secret Santa
import { z } from 'zod';

// DTO Zod pour la création d'un évènement
// Note: ownerId est injecté par le contrôleur depuis le token JWT, donc absent du schema public
export const eventSchema = z.object({
  title: z.string().min(1, { message: 'Le titre est requis.' }).transform((s) => s.trim()),
  description: z.string().optional().transform((s) => (s ? s.trim() : undefined)),
  eventDate: z.string()
    .refine((val) => {
      const d = new Date(val);
      return !Number.isNaN(d.getTime());
    }, { message: "La date de l'évènement doit être au format ISO." })
    .refine((val) => {
      const d = new Date(val);
      return d.getTime() > Date.now();
    }, { message: "La date de l'évènement doit être dans le futur." }),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .refine((v) => v === undefined || (!Number.isNaN(Number(v)) && Number(v) >= 0), { message: 'Le budget doit être un nombre positif.' })
    .transform((v) => (v === undefined ? undefined : Number(v))),
});

export const updateEventSchema = eventSchema.pick({
  title: true,
  description: true,
  eventDate: true,
  budget: true,
}).partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// Input pour la création (validé par Zod, sans ownerId)
export type EventInput = z.infer<typeof eventSchema>;

// Input normalisé pour le service (avec ownerId injecté)
export interface NormalizedEventInput {
  title: string;
  description?: string;
  eventDate: Date;
  budget?: number;
  ownerId: number;
}

export interface EventRecord extends NormalizedEventInput {
  id: string;
  createdAt: Date;
}

export const validateEventInput = (payload: unknown) => {
  const parsed = eventSchema.safeParse(payload);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    }));
    return { errors } as const;
  }

  // Normaliser les données de base (sans ownerId encore)
  const value = parsed.data;
  return {
    data: {
      title: value.title,
      description: value.description === '' ? undefined : value.description,
      eventDate: new Date(value.eventDate),
      budget: value.budget as number | undefined,
    }
  } as const;
};
