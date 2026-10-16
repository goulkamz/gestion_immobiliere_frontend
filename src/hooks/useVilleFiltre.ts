import { useMemo } from "react";
import { useAgentUiStore } from "@/store/agentUiStore";
import type { VilleFiltreParams } from "@/api/types";

/** Paramètres de filtre ville à joindre aux requêtes de liste de l'espace agent (vide = toutes les villes). */
export function useVilleFiltre(): VilleFiltreParams {
  const ville = useAgentUiStore((s) => s.ville);
  return useMemo(() => {
    if (ville === "autres") return { sansVille: true };
    if (ville !== "") return { idVille: Number(ville) };
    return {};
  }, [ville]);
}
