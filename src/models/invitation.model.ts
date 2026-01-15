import { z } from 'zod';

export const invitationSchema = z.object({
    email: z.string().email({ message: 'Email invalide.' }).transform((s) => s.trim().toLowerCase()),
});

export type InvitationInput = z.infer<typeof invitationSchema>;

export interface InvitationRecord {
    id: string;
    event_id: string;
    email: string;
    user_id?: number | null;
    status: 'pending' | 'accepted' | 'declined';
    created_at: Date;
    updated_at: Date;
}
