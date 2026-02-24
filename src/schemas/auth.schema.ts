import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .email()
    .min(1, 'Email requis')
    .max(255),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(255, 'Le mot de passe ne peut pas dépasser 255 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
  first_name: z.string().trim().min(1, 'Le prénom ne peut pas être vide').max(100).optional(),
  last_name: z.string().trim().min(1, 'Le nom de famille ne peut pas être vide').max(100).optional(),
});

export const loginSchema = z.object({
  email: z
    .email()
    .min(1)
    .max(255),
  password: z
    .string()
    .min(1)
    .max(255),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

