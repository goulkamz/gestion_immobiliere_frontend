import { useQuery } from "@tanstack/react-query";
import { statsBailleurApi } from "@/api/stats-bailleur";

export const statsBailleurQueryKeys = {
  patrimoine: ["stats-bailleur", "patrimoine"] as const,
  revenus: ["stats-bailleur", "revenus"] as const,
  depenses: ["stats-bailleur", "depenses"] as const,
};

export function useBailleurPatrimoineQuery() {
  return useQuery({ queryKey: statsBailleurQueryKeys.patrimoine, queryFn: statsBailleurApi.getPatrimoine });
}

export function useBailleurRevenusQuery() {
  return useQuery({ queryKey: statsBailleurQueryKeys.revenus, queryFn: statsBailleurApi.getRevenus });
}

/** Dépenses avancées par l'agence sur les cours du bailleur et devis en attente de sa réponse. */
export function useBailleurDepensesStatsQuery() {
  return useQuery({ queryKey: statsBailleurQueryKeys.depenses, queryFn: statsBailleurApi.getDepenses });
}
