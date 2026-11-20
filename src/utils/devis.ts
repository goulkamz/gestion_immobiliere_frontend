import type { StatutDevis } from "@/api/types";

export const STATUTS_DEVIS: readonly StatutDevis[] = ["EN_ATTENTE", "A_RENEGOCIER", "ACCEPTE", "REALISE", "REJETE", "EXPIRE", "ANNULE"];

/** Libellés des cartes de compteurs au-dessus des listes (un compteur par statut, au pluriel). */
export const DEVIS_COMPTEUR_LABELS: Record<StatutDevis, string> = {
  EN_ATTENTE: "En attente",
  A_RENEGOCIER: "À renégocier",
  ACCEPTE: "Acceptés",
  REALISE: "Réalisés",
  REJETE: "Rejetés",
  ANNULE: "Retirés",
  EXPIRE: "Expirés",
};

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
