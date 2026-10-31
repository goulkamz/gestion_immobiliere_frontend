import type { BornesPeriode } from "@/api/stats-admin";

export type PeriodeId = "mois" | "mois-choisi" | "trimestre" | "annee" | "tout";

export const PERIODES: { id: PeriodeId; label: string }[] = [
  { id: "mois", label: "Ce mois-ci" },
  { id: "mois-choisi", label: "Un mois précis" },
  { id: "trimestre", label: "3 derniers mois" },
  { id: "annee", label: "Cette année" },
  { id: "tout", label: "Depuis le début" },
];

const COMPARAISONS: Record<PeriodeId, string> = {
  mois: "au mois précédent",
  "mois-choisi": "au mois précédent",
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

/** Mois courant au format de l'entrée de type « month » (aaaa-mm). */
export function moisCourant(ref: Date = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

/** Période d'un mois choisi (aaaa-mm), comparée au mois qui le précède. Un mois invalide donne le mois courant. */
export function calculerMois(aaaaMm: string): PeriodeCalculee {
  const [a, m] = aaaaMm.split("-").map(Number);
  const ref = a && m ? new Date(a, m - 1, 1) : new Date();
  return calculerPeriode("mois", ref);
}

/** Libellé « novembre 2026 » d'un mois aaaa-mm. */
export function libelleMois(aaaaMm: string): string {
  const [a, m] = aaaaMm.split("-").map(Number);
  if (!a || !m) return "";
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/**
 * « payés d'avance en octobre 2026 » ou « payés d'avance entre septembre et octobre 2026 » : le mois vient des dates
 * réelles des paiements, jamais d'un mois écrit en dur.
 */
export function libelleAvance(premier: string | null, dernier: string | null): string {
  if (!premier || !dernier) return "payés d'avance";
  const mois = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { month: "long" });
  const annee = (iso: string) => iso.slice(0, 4);
  if (premier.slice(0, 7) === dernier.slice(0, 7)) return `payés d'avance en ${mois(premier)} ${annee(premier)}`;
  if (annee(premier) === annee(dernier)) return `payés d'avance entre ${mois(premier)} et ${mois(dernier)} ${annee(dernier)}`;
  return `payés d'avance entre ${mois(premier)} ${annee(premier)} et ${mois(dernier)} ${annee(dernier)}`;
}
