import type { UseFormRegisterReturn } from "react-hook-form";
import { useVillesQuery } from "@/hooks/queries/usePublicCatalog";
import { VILLE_AUTRE } from "@/utils/ville";
import { Input } from "./Input";
import { Select } from "./Select";

interface VilleFieldsProps {
  ville: UseFormRegisterReturn;
  villeAutre: UseFormRegisterReturn;
  /** Valeur courante du champ ville (via `watch`), pour afficher le champ « autre ville ». */
  valeur: string | undefined;
  erreurVille?: string;
  erreurAutre?: string;
}

/** Choix de la ville dans la liste des villes couvertes, ou « Autre ville… » avec saisie libre (le visiteur ne crée pas de ville). */
export function VilleFields({ ville, villeAutre, valeur, erreurVille, erreurAutre }: VilleFieldsProps) {
  const villes = useVillesQuery().data?.content ?? [];
  return (
    <div className="space-y-4">
      <Select
        label="Ville"
        required
        placeholder="Choisir une ville"
        error={erreurVille}
        options={[...villes.map((v) => ({ value: String(v.idVille), label: v.nomVille })), { value: VILLE_AUTRE, label: "Autre ville…" }]}
        {...ville}
      />
      {valeur === VILLE_AUTRE && <Input label="Nom de la ville" required maxLength={100} error={erreurAutre} {...villeAutre} />}
    </div>
  );
}
