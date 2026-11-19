import { z } from "zod";

/** Demande de renégociation ou rejet d'un devis : toujours motivé, pour que l'agence sache quoi revoir. */
export const reponseDevisSchema = z.object({
  commentaire: z.string().trim().min(1, "Précisez votre réponse").max(254, "254 caractères maximum"),
});
export type ReponseDevisFormValues = z.infer<typeof reponseDevisSchema>;
export type ReponseDevisFormInput = z.input<typeof reponseDevisSchema>;
