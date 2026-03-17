import { z } from "zod";

export const exclusionSchema = z.object({
  id: z.number(),
  event_id: z.string().uuid(),
  giver_id: z.number(),
  receiver_id: z.number(),
  created_at: z.date(),
});

export type Exclusion = z.infer<typeof exclusionSchema>;
