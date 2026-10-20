const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

/**
 * Intl sépare les milliers par une espace fine insécable (U+202F), absente de la police Plus Jakarta Sans :
 * le navigateur la dessinerait avec une autre police, très étroite. On met l'espace fine ordinaire (U+2009),
 * que la police possède, entourée de joints de mots (U+2060) pour qu'un montant ne soit jamais coupé en fin de ligne.
 */
const ESPACE_FINE_INSECABLE = "\u2060\u2009\u2060";

export function formatMontant(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return currencyFormatter.format(value).replace(/\u202F/g, ESPACE_FINE_INSECABLE);
}

const MOIS_COURTS = [
  "jan", "fév", "mar", "avr", "mai", "juin",
  "juil", "août", "sep", "oct", "nov", "déc",
];

/** Date courte compacte, ex. "07 oct 2026" (espaces insécables : ne passe jamais à la ligne). */
function dateCourte(date: Date): string {
  const jour = String(date.getDate()).padStart(2, "0");
  return `${jour}\u00A0${MOIS_COURTS[date.getMonth()]}\u00A0${date.getFullYear()}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateCourte(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const heure = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${dateCourte(date)} ${heure}:${minute}`;
}

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/** Formate une date "yyyy-MM-dd" (ex. période de revenu bailleur) en "mois année" (ex. "septembre 2026"). */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return monthFormatter.format(date);
}
