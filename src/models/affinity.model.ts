import { z } from "zod";

export const AFFINITY_VALUES = ["avoid", "neutral", "favorable"] as const;
export type AffinityValue = (typeof AFFINITY_VALUES)[number];

export const affinitySchema = z.object({
  id: z.number(),
  event_id: z.string().uuid(),
  giver_id: z.number(),
  target_id: z.number(),
  affinity: z.enum(AFFINITY_VALUES),
  created_at: z.date(),
  updated_at: z.date(),
});

export type AffinityRecord = z.infer<typeof affinitySchema>;

export const setAffinitySchema = z.object({
  affinity: z.enum(AFFINITY_VALUES, {
    error: "L'affinité doit être 'avoid', 'neutral' ou 'favorable'.",
  }),
});
