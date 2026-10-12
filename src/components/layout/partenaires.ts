export interface Partenaire {
  id: string;
  nom: string;
  /** Nom de fichier attendu dans public/images/partenaires/ (SVG de préférence, sinon PNG/WebP, fond transparent). */
  logo: string;
  /** Site du partenaire ; si absent, le logo n'est pas cliquable. */
  url?: string;
  /** Ordre d'affichage croissant. */
  ordre: number;
}

/**
 * Partenaires affichés en pied de page, triés par `ordre`. Aucun partenariat
 * réel n'étant communiqué pour le moment, cette liste est un espace réservé
 * (logos/noms génériques) à remplacer par les vrais partenaires avant mise
 * en production — ne pas y mettre le logo d'une entreprise réelle sans son
 * accord.
 */
export const PARTENAIRES: Partenaire[] = [
  { id: "partenaire-1", nom: "Partenaire 1", logo: "partenaire-1.svg", ordre: 1 },
  { id: "partenaire-2", nom: "Partenaire 2", logo: "partenaire-2.svg", ordre: 2 },
  { id: "partenaire-3", nom: "Partenaire 3", logo: "partenaire-3.svg", ordre: 3 },
  { id: "partenaire-4", nom: "Partenaire 4", logo: "partenaire-4.svg", ordre: 4 },
];
