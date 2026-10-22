import { z } from "zod";

export const paysSchema = z.object({
  codePays: z.string().trim().min(1, "Le code est requis"),
  nomPays: z.string().trim().min(1, "Le nom est requis"),
});
export type PaysFormValues = z.infer<typeof paysSchema>;

export const villeSchema = z.object({
  idPays: z.coerce.number({ message: "Choisissez un pays" }).int().positive("Choisissez un pays"),
  codeVille: z.string().trim().min(1, "Le code est requis"),
  nomVille: z.string().trim().min(1, "Le nom est requis"),
});
export type VilleFormValues = z.infer<typeof villeSchema>;
export type VilleFormInput = z.input<typeof villeSchema>;

export const secteurSchema = z.object({
  idVille: z.coerce.number({ message: "Choisissez une ville" }).int().positive("Choisissez une ville"),
  codeSecteur: z.string().trim().min(1, "Le code est requis"),
  nomSecteur: z.string().trim().min(1, "Le nom est requis"),
});
export type SecteurFormValues = z.infer<typeof secteurSchema>;
export type SecteurFormInput = z.input<typeof secteurSchema>;
