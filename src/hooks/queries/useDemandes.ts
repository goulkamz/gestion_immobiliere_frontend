import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demandesApi, type DemandeListParams } from "@/api/demandes";
import type { UpdateStatutDemandeRequest } from "@/api/types";

export const demandesQueryKeys = {
  list: (params?: DemandeListParams) => ["demandes", params] as const,
};

export function useDemandesQuery(params?: DemandeListParams) {
  return useQuery({ queryKey: demandesQueryKeys.list(params), queryFn: () => demandesApi.getDemandes(params), placeholderData: keepPreviousData });
}

export function useUpdateStatutDemandeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateStatutDemandeRequest }) => demandesApi.updateStatut(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demandes"] }),
  });
}
