import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contratsApi, type ContratLocationListParams } from "@/api/contrats";
import type { ReglerDecompteSortieRequest, ResilierLocationRequest, TerminerLocationRequest, UpdateContratLocationRequest } from "@/api/types";

export const contratsQueryKeys = {
  list: (params?: ContratLocationListParams) => ["contrats-location", params] as const,
  decompte: (idContrat: number) => ["contrats-location", idContrat, "decompte-sortie"] as const,
};

export function useContratsLocationQuery(params?: ContratLocationListParams) {
  return useQuery({
    queryKey: contratsQueryKeys.list(params),
    queryFn: () => contratsApi.getContratsLocation(params),
    placeholderData: keepPreviousData,
  });
}

export function useDecompteSortieQuery(idContrat: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contratsQueryKeys.decompte(idContrat),
    queryFn: () => contratsApi.getDecompteSortie(idContrat),
    enabled: options?.enabled ?? true,
  });
}

export function useModifierContratLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateContratLocationRequest }) => contratsApi.modifier(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats-location"] }),
  });
}

export function useTerminerLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TerminerLocationRequest }) => contratsApi.terminer(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats-location"] });
      queryClient.invalidateQueries({ queryKey: ["public", "maisons"] });
    },
  });
}

export function useResilierLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ResilierLocationRequest }) => contratsApi.resilier(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats-location"] });
      queryClient.invalidateQueries({ queryKey: ["public", "maisons"] });
    },
  });
}

export function useReglerDecompteSortieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idDecompte, body }: { idDecompte: number; body: ReglerDecompteSortieRequest }) =>
      contratsApi.reglerDecompteSortie(idDecompte, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats-location"] }),
  });
}
