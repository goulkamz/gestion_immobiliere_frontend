import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statsAdminApi } from "@/api/stats-admin";
import type { BornesPeriode } from "@/api/stats-admin";

/** Le serveur garde aussi ses résultats 60 s : inutile de les redemander plus souvent. */
const STALE_MS = 60_000;

export const statsAdminQueryKeys = {
  stats: ["stats-admin", "global"] as const,
  villes: (b?: BornesPeriode) => ["stats-admin", "villes", b?.debut ?? "debut", b?.fin ?? "fin"] as const,
  topBailleurs: ["stats-admin", "top-bailleurs"] as const,
  creancesLocataires: ["stats-admin", "creances-locataires"] as const,
  creanciersBailleurs: ["stats-admin", "creanciers-bailleurs"] as const,
  finances: (b?: BornesPeriode) => ["stats-admin", "finances", b?.debut ?? "debut", b?.fin ?? "fin"] as const,
  activite: (b?: BornesPeriode) => ["stats-admin", "activite", b?.debut ?? "debut", b?.fin ?? "fin"] as const,
  evolution: (mois: number) => ["stats-admin", "evolution", mois] as const,
};

export function useAdminStatsQuery() {
  return useQuery({ staleTime: STALE_MS, queryKey: statsAdminQueryKeys.stats, queryFn: statsAdminApi.getStats });
}

export function useAdminVillesQuery(bornes?: BornesPeriode) {
  return useQuery({
    staleTime: STALE_MS,
    queryKey: statsAdminQueryKeys.villes(bornes),
    queryFn: () => statsAdminApi.getVilles(bornes),
    placeholderData: keepPreviousData,
  });
}

export function useAdminTopBailleursQuery() {
  return useQuery({ staleTime: STALE_MS, queryKey: statsAdminQueryKeys.topBailleurs, queryFn: () => statsAdminApi.getTopBailleurs(10) });
}

export function useAdminCreancesLocatairesQuery() {
  return useQuery({ staleTime: STALE_MS, queryKey: statsAdminQueryKeys.creancesLocataires, queryFn: statsAdminApi.getLocatairesCreances });
}

export function useAdminBailleursCreanciersQuery() {
  return useQuery({ staleTime: STALE_MS, queryKey: statsAdminQueryKeys.creanciersBailleurs, queryFn: statsAdminApi.getBailleursCreanciers });
}

/** Flux de la période ; `enabled` permet de ne pas interroger la période précédente quand elle n'existe pas ("tout"). */
export function useAdminFinancesQuery(bornes: BornesPeriode | null) {
  return useQuery({
    staleTime: STALE_MS,
    queryKey: statsAdminQueryKeys.finances(bornes ?? undefined),
    queryFn: () => statsAdminApi.getFinances(bornes ?? undefined),
    enabled: bornes !== null,
    placeholderData: keepPreviousData,
  });
}

export function useAdminEvolutionQuery(mois: number) {
  return useQuery({
    staleTime: STALE_MS,
    queryKey: statsAdminQueryKeys.evolution(mois),
    queryFn: () => statsAdminApi.getEvolution(mois),
    placeholderData: keepPreviousData,
  });
}

/** Éléments créés pendant la période ; `enabled` évite d'interroger la période précédente quand elle n'existe pas. */
export function useAdminActiviteQuery(bornes: BornesPeriode | null) {
  return useQuery({
    staleTime: STALE_MS,
    queryKey: statsAdminQueryKeys.activite(bornes ?? undefined),
    queryFn: () => statsAdminApi.getActivite(bornes ?? undefined),
    enabled: bornes !== null,
    placeholderData: keepPreviousData,
  });
}
