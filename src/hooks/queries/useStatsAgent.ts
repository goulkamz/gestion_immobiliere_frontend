import { useQuery } from "@tanstack/react-query";
import { statsAgentApi } from "@/api/stats-agent";

export const statsAgentQueryKeys = {
  demandesEnAttente: ["stats-agent", "demandes-en-attente"] as const,
  reservationsEnAttente: ["stats-agent", "reservations-en-attente"] as const,
  mesMandats: ["stats-agent", "mes-mandats"] as const,
  echeancesRetard: ["stats-agent", "echeances-retard"] as const,
};

export function useAgentDemandesEnAttenteQuery() {
  return useQuery({ queryKey: statsAgentQueryKeys.demandesEnAttente, queryFn: statsAgentApi.getDemandesEnAttente });
}

export function useAgentReservationsEnAttenteQuery() {
  return useQuery({ queryKey: statsAgentQueryKeys.reservationsEnAttente, queryFn: statsAgentApi.getReservationsEnAttente });
}

export function useAgentMesMandatsQuery() {
  return useQuery({ queryKey: statsAgentQueryKeys.mesMandats, queryFn: statsAgentApi.getMesMandats });
}

export function useAgentEcheancesRetardQuery() {
  return useQuery({ queryKey: statsAgentQueryKeys.echeancesRetard, queryFn: statsAgentApi.getEcheancesRetard });
}
