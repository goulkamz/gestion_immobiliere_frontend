import { z } from "zod";

export const reservationSchema = z.object({
  idMaison: z.coerce.number({ message: "Choisissez une maison" }).int().positive("Choisissez une maison"),
});
export type ReservationFormValues = z.infer<typeof reservationSchema>;
export type ReservationFormInput = z.input<typeof reservationSchema>;

export const locationBienServiceSchema = z
  .object({
    idBienService: z.coerce.number({ message: "Choisissez un bien ou un service" }).int().positive("Choisissez un bien ou un service"),
    destination: z.string().optional(),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
  })
  .refine((d) => d.dateFin > d.dateDebut, {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  });
export type LocationBienServiceFormValues = z.infer<typeof locationBienServiceSchema>;
export type LocationBienServiceFormInput = z.input<typeof locationBienServiceSchema>;

/** Variante sans idBienService, pour la page de détail public où le bien est déjà connu du contexte. */
export const locationDatesSchema = z
  .object({
    destination: z.string().optional(),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
  })
  .refine((d) => d.dateFin > d.dateDebut, {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  });
export type LocationDatesFormValues = z.infer<typeof locationDatesSchema>;
export type LocationDatesFormInput = z.input<typeof locationDatesSchema>;
