import { MapPin } from "lucide-react";
import { Select } from "@/components/ui";
import { useVillesQuery } from "@/hooks/queries/usePublicCatalog";
import { useAgentUiStore, type VilleChoix } from "@/store/agentUiStore";

/** Sélecteur unique de ville de l'espace agent : filtre toutes les listes concernées, choix mémorisé. */
export function AgentVilleSelect() {
  const ville = useAgentUiStore((s) => s.ville);
  const setVille = useAgentUiStore((s) => s.setVille);
  const villes = useVillesQuery().data?.content ?? [];

  return (
    <div className="flex items-center justify-end gap-2">
      <MapPin size={16} className="text-primary-600" aria-hidden="true" />
      <div className="w-56">
        <Select
          aria-label="Filtrer par ville"
          value={ville}
          onChange={(e) => setVille(e.target.value as VilleChoix)}
          placeholder="Toutes les villes"
          options={[
            ...villes.map((v) => ({ value: String(v.idVille), label: v.nomVille })),
            { value: "autres", label: "Autres villes" },
          ]}
        />
      </div>
    </div>
  );
}
