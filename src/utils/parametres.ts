import type { ParametreResponse } from "@/api/types";

/** Lit un paramètre système entier par sa clé, avec repli si absent (miroir de ParametreService.getEntier côté backend). */
export function getParametreEntier(parametres: ParametreResponse[] | undefined, cle: string, valeurParDefaut: number): number {
  const parametre = parametres?.find((p) => p.cle === cle);
  if (!parametre) return valeurParDefaut;
  const valeur = Number.parseInt(parametre.valeur, 10);
  return Number.isNaN(valeur) ? valeurParDefaut : valeur;
}
