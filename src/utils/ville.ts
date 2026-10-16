import { z } from "zod";

/** Valeur du champ « ville » quand l'utilisateur choisit « Autre ville… » (ville absente de la liste). */
export const VILLE_AUTRE = "autre";

/** Indication affichée dans les champs de description : la ville seule est demandée, le secteur se précise dans le texte. */
export const INDICATION_SECTEUR = "Précisez le secteur après votre description (ex. : secteur 15, Dassasgho…).";

/** Champs de formulaire communs : liste des villes + nom libre si « Autre ville… ». */
export const villeChamps = {
  ville: z.string().min(1, "La ville est requise"),
  villeAutre: z.string().max(100, "100 caractères maximum").optional(),
};

/** À brancher en `.superRefine(...)` : le nom libre est obligatoire quand « Autre ville… » est choisi. */
export function exigerVilleAutre(v: { ville: string; villeAutre?: string }, ctx: z.RefinementCtx) {
  if (v.ville === VILLE_AUTRE && !v.villeAutre?.trim()) {
    ctx.addIssue({ code: "custom", path: ["villeAutre"], message: "Précisez le nom de la ville" });
  }
}

/** Sépare les champs ville du formulaire du reste, et les convertit en `idVille` ou `villeAutre` pour l'API. */
export function separerVille<T extends { ville: string; villeAutre?: string }>(values: T) {
  const { ville, villeAutre, ...reste } = values;
  const choix = ville === VILLE_AUTRE ? { villeAutre: villeAutre?.trim() } : { idVille: Number(ville) };
  return { reste, choix };
}

/** Valeurs initiales du formulaire à partir d'une ligne existante. */
export function villeInitiale(l: { idVille: number | null; villeAutre: string | null }): { ville: string; villeAutre: string } {
  if (l.idVille != null) return { ville: String(l.idVille), villeAutre: "" };
  if (l.villeAutre) return { ville: VILLE_AUTRE, villeAutre: l.villeAutre };
  return { ville: "", villeAutre: "" };
}

/** Libellé d'affichage de la ville d'une ligne (ville répertoriée, sinon nom libre). */
export function libelleVille(l: { nomVille: string | null; villeAutre: string | null }): string {
  return l.nomVille ?? (l.villeAutre ? `${l.villeAutre} (autre)` : "-");
}
