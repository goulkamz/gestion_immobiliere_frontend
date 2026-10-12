import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offresApi, type OffreListParams } from "@/api/offres";
import type { UpdateStatutOffreRequest } from "@/api/types";

export const offresQueryKeys = {
  list: (params?: OffreListParams) => ["offres", params] as const,
};

export function useOffresQuery(params?: OffreListParams) {
  return useQuery({ queryKey: offresQueryKeys.list(params), queryFn: () => offresApi.getOffres(params), placeholderData: keepPreviousData });
}

export function useUpdateStatutOffreMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateStatutOffreRequest }) => offresApi.updateStatut(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offres"] }),
  });
}
