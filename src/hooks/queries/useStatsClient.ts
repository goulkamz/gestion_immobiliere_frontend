import { useQuery } from "@tanstack/react-query";
import { statsClientApi } from "@/api/stats-client";

export const statsClientQueryKeys = {
  locations: ["stats-client", "locations"] as const,
  echeances: ["stats-client", "echeances"] as const,
  remboursements: ["stats-client", "remboursements"] as const,
};

export function useClientLocationsStatsQuery() {
  return useQuery({ queryKey: statsClientQueryKeys.locations, queryFn: statsClientApi.getLocations });
}

export function useClientEcheancesStatsQuery() {
  return useQuery({ queryKey: statsClientQueryKeys.echeances, queryFn: statsClientApi.getEcheances });
}

export function useClientRemboursementsStatsQuery() {
  return useQuery({ queryKey: statsClientQueryKeys.remboursements, queryFn: statsClientApi.getRemboursements });
}
