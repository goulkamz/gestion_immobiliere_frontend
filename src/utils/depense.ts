import type { CategorieDepense, StatutDepense } from "@/api/types";
import { formatMontant } from "@/utils/format";

export const CATEGORIES_DEPENSE: CategorieDepense[] = [
  "ETANCHEITE",
  "PLOMBERIE",
  "ELECTRICITE",
  "VIDANGE",
  "MACONNERIE",
  "MENUISERIE",
  "PEINTURE",
  "AUTRE",
];

export const CATEGORIE_DEPENSE_LABELS: Record<CategorieDepense, string> = {
  ETANCHEITE: "Étanchéité",
  PLOMBERIE: "Plomberie",
  ELECTRICITE: "Électricité",
  VIDANGE: "Vidange",
  MACONNERIE: "Maçonnerie",
  MENUISERIE: "Menuiserie",
  PEINTURE: "Peinture",
  AUTRE: "Autre",
};

export const STATUTS_DEPENSE: readonly StatutDepense[] = ["EN_COURS", "A_REGLER", "SOLDEE", "ANNULEE"];

/** « En une fois » ou « Sur 6 reversements (10 000 F CFA chacun) ». */
export function etalementLabel(depense: { nombreMois: number; mensualite: number }): string {
  return depense.nombreMois <= 1 ? "En une fois" : `Sur ${depense.nombreMois} reversements (${formatMontant(depense.mensualite)} chacun)`;
}

/**
 * Colonne « Retenue » d'une liste : l'étalement, ou ce qu'il devient après une résiliation
 * (plus d'étalement, tout le solde est dû) ou un rééchelonnement (mois restants).
 */
export function retenueLabel(depense: {
  statut: StatutDepense;
  nombreMois: number;
  mensualite: number;
  moisRestants: number | null;
  nombreMoisInitial: number | null;
}): string {
  if (depense.statut === "A_REGLER") return "Solde dû en totalité";
  if (depense.statut === "EN_COURS" && depense.nombreMoisInitial !== null && depense.moisRestants !== null) {
    return depense.moisRestants <= 1
      ? "Rééchelonnée : solde en une fois"
      : `Rééchelonnée : encore ${depense.moisRestants} reversements (${formatMontant(depense.mensualite)} chacun)`;
  }
  return etalementLabel(depense);
}
