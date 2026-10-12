const MARGE_SECURITE_MS = 5 * 60 * 1000;

/**
 * "Maintenant" + une marge de sécurité, formaté en LocalDateTime (sans fuseau), pour que le
 * timestamp reste valide côté serveur (@FutureOrPresent) malgré la latence réseau — utilisé
 * comme dateDebut des réservations, qui ne sont qu'un marqueur technique de blocage.
 */
export function dateDebutMaintenant(): string {
  return formatLocalDateTime(new Date(Date.now() + MARGE_SECURITE_MS));
}

/** Valeur par défaut d'un champ datetime-local (minutes) : maintenant + marge de sécurité. */
export function dateDebutInputDefaut(): string {
  return dateDebutMaintenant().slice(0, 16);
}

function formatLocalDateTime(avecMarge: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${avecMarge.getFullYear()}-${pad(avecMarge.getMonth() + 1)}-${pad(avecMarge.getDate())}T${pad(avecMarge.getHours())}:${pad(avecMarge.getMinutes())}:${pad(avecMarge.getSeconds())}`;
}
