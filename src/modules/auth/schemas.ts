import { z } from "zod";
import { PASSWORD_PATTERN } from "@/utils/validation";

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nom: z.string().min(1, "Le nom est requis").max(254),
    prenom: z.string().min(1, "Le prénom est requis").max(254),
    sexe: z.enum(["M", "F"], { message: "Le sexe est requis" }),
    email: z.string().min(1, "L'email est requis").email("Email invalide").max(254),
    password: z
      .string()
      .min(6, "6 caractères minimum")
      .max(120)
      .regex(PASSWORD_PATTERN, "Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial"),
    confirmPassword: z.string().min(1, "Merci de confirmer le mot de passe"),
    dateNaissance: z.string().min(1, "La date de naissance est requise"),
    telephone: z.string().min(1, "Le téléphone est requis"),
    telephone1: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    code: z.string().min(1, "Le code est requis"),
    newPassword: z
      .string()
      .min(6, "6 caractères minimum")
      .max(120)
      .regex(PASSWORD_PATTERN, "Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial"),
    confirmPassword: z.string().min(1, "Merci de confirmer le mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const activationSchema = z.object({
  code: z.string().min(1, "Le code d'activation est requis"),
});
export type ActivationFormValues = z.infer<typeof activationSchema>;
