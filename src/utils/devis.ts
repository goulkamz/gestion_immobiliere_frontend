import type { StatutDevis } from "@/api/types";

export const STATUTS_DEVIS: readonly StatutDevis[] = ["EN_ATTENTE", "A_RENEGOCIER", "ACCEPTE", "REALISE", "REJETE", "EXPIRE", "ANNULE"];

/** Libellés propres aux devis (masculin, et « Retiré » plutôt que le « Annulée » générique). */
export const DEVIS_STATUT_LABELS: Record<StatutDevis, string> = {
  EN_ATTENTE: "En attente",
  A_RENEGOCIER: "À renégocier",
  ACCEPTE: "Accepté",
  REALISE: "Réalisé",
  REJETE: "Rejeté",
  ANNULE: "Retiré",
  EXPIRE: "Expiré",
};
