import { z } from "zod";

export const contactSchema = z.object({
  nomComplet: z.string().min(1, "Le nom est requis"),
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  sujet: z.string().optional(),
  message: z.string().min(1, "Le message est requis"),
});
export type ContactFormValues = z.infer<typeof contactSchema>;

export const demandeSchema = z.object({
  nomComplet: z.string().min(1, "Le nom est requis"),
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  typeBien: z.string().min(1, "Le type de bien recherché est requis"),
  localisationSouhaite: z.string().optional(),
  budgetMax: z.coerce.number().positive().optional(),
  description: z.string().optional(),
});
export type DemandeFormValues = z.infer<typeof demandeSchema>;
/** Forme des champs avant coercition (ex: budgetMax saisi comme chaîne) — à utiliser pour typer `useForm`. */
export type DemandeFormInput = z.input<typeof demandeSchema>;

export const offreSchema = z.object({
  nomComplet: z.string().min(1, "Le nom est requis"),
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  typeOffre: z.string().min(1, "Le type de bien proposé est requis"),
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  adresse: z.string().optional(),
});
export type OffreFormValues = z.infer<typeof offreSchema>;

const noAngleBrackets = (v: string) => !/[<>]/.test(v);
const noLiens = (v: string) => !/(https?:|www\.|ftp:)/i.test(v);

export const temoignageSchema = z.object({
  nomAuteur: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "100 caractères maximum")
    .refine(noAngleBrackets, "Les caractères < et > sont interdits"),
  role: z.enum(["PROPRIETAIRE", "LOCATAIRE", "AUTRE"], { message: "Choisissez un rôle" }),
  texte: z
    .string()
    .min(10, "10 caractères minimum")
    .max(1000, "1000 caractères maximum")
    .refine(noAngleBrackets, "Les caractères < et > sont interdits")
    .refine(noLiens, "Les liens sont interdits"),
  note: z.coerce.number().int().min(1).max(5).optional().or(z.literal("").transform(() => undefined)),
  // Champ piège anti-robot, jamais rempli par un utilisateur réel : non validé, juste transmis tel quel.
  siteWeb: z.string().optional(),
});
export type TemoignageFormValues = z.infer<typeof temoignageSchema>;
export type TemoignageFormInput = z.input<typeof temoignageSchema>;
