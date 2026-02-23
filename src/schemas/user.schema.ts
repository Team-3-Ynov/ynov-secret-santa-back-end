import { z } from 'zod';

export const updateProfileSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional(),
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores')
    .optional(),
}).refine(data => data.email !== undefined || data.username !== undefined, {
  message: 'Au moins un champ (email ou username) doit être fourni',
});

export const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(255, 'Le nouveau mot de passe ne peut pas dépasser 255 caractères')
    .regex(/[A-Z]/, 'Le nouveau mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le nouveau mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le nouveau mot de passe doit contenir au moins un chiffre'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
