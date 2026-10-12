import type { ModeFacturation } from "@/api/types";
import { formatMonth } from "@/utils/format";

export const MODE_FACTURATION_LABELS: Record<ModeFacturation, string> = {
  MENSUEL: "Mensuel",
  CUMUL: "Cumulé (versement groupé à la demande)",
  COMMISSION: "Commission",
};

/**
 * Mois d'occupation d'une échéance de mandat : le loyer d'un mois tombe le 1er du mois suivant,
 * donc l'échéance du 1er octobre correspond à l'occupation de septembre.
 */
export function moisOccupation(dateEcheance: string | null | undefined): string {
  if (!dateEcheance) return "-";
  const [annee, mois] = dateEcheance.split("-").map(Number);
  if (!annee || !mois) return "-";
  const precedent = new Date(Date.UTC(annee, mois - 2, 1));
  return formatMonth(precedent.toISOString());
}
