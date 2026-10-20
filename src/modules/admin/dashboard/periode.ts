import type { BornesPeriode } from "@/api/stats-admin";

export type PeriodeId = "mois" | "trimestre" | "annee" | "tout";

export const PERIODES: { id: PeriodeId; label: string }[] = [
  { id: "mois", label: "Ce mois-ci" },
  { id: "trimestre", label: "3 derniers mois" },
  { id: "annee", label: "Cette année" },
  { id: "tout", label: "Depuis le début" },
];

const COMPARAISONS: Record<PeriodeId, string> = {
  mois: "au mois précédent",
  trimestre: "aux 3 mois précédents",
  annee: "à l'année précédente",
  tout: "",
};

/** Date locale au format aaaa-mm-jj (sans décalage de fuseau). */
function iso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const jj = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${jj}`;
}

function bornes(debut: Date, fin: Date): BornesPeriode {
  return { debut: iso(debut), fin: iso(fin) };
}

export interface PeriodeCalculee {
  courante: BornesPeriode;
  /** Période de même durée juste avant, pour les variations ; null si "depuis le début". */
  precedente: BornesPeriode | null;
  /** Fin de phrase pour « vs … » (vide si pas de comparaison). */
  comparaison: string;
}

export function calculerPeriode(id: PeriodeId, ref: Date = new Date()): PeriodeCalculee {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  switch (id) {
    case "mois":
      return {
        courante: bornes(new Date(y, m, 1), new Date(y, m + 1, 0)),
        precedente: bornes(new Date(y, m - 1, 1), new Date(y, m, 0)),
        comparaison: COMPARAISONS.mois,
      };
    case "trimestre":
      return {
        courante: bornes(new Date(y, m - 2, 1), new Date(y, m + 1, 0)),
        precedente: bornes(new Date(y, m - 5, 1), new Date(y, m - 2, 0)),
        comparaison: COMPARAISONS.trimestre,
      };
    case "annee":
      return {
        courante: bornes(new Date(y, 0, 1), new Date(y, 11, 31)),
        precedente: bornes(new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)),
        comparaison: COMPARAISONS.annee,
      };
    default:
      return { courante: {}, precedente: null, comparaison: "" };
  }
}
