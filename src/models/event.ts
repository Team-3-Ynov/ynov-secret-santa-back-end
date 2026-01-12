// Types et helpers liés aux évènements Secret Santa
import { z } from 'zod';

// DTO Zod pour la création d'un évènement
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
  ownerEmail: z.string().email({ message: 'Un email propriétaire valide est requis.' }).transform((s) => s.trim().toLowerCase()),
});

export type EventInput = z.infer<typeof eventSchema>;

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

export const validateEventInput = (payload: unknown) => {
  const parsed = eventSchema.safeParse(payload);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    }));
    return { errors } as const;
  }

  // Normaliser les données pour correspondre à NormalizedEventInput
  const value = parsed.data;
  const normalized: NormalizedEventInput = {
    title: value.title,
    description: value.description === '' ? undefined : value.description,
    eventDate: new Date(value.eventDate),
    budget: value.budget as number | undefined,
    ownerEmail: value.ownerEmail,
  };

  return { data: normalized } as const;
};
