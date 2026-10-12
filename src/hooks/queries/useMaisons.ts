import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maisonsApi } from "@/api/maisons";
import type { MaisonListParams } from "@/api/public";
import type { CreateMaisonRequest, UpdateMaisonRequest, UpdateStatutMaisonRequest } from "@/api/types";

export const maisonsQueryKeys = {
  list: (params?: MaisonListParams) => ["maisons", params] as const,
};

/**
 * Liste authentifiée (agent/admin : toutes les maisons, bailleur : celles de ses cours), sans la règle de mandat
 * du catalogue public (`useMaisonsQuery` de `usePublicCatalog`, réservé à ce qui est proposé au public).
 */
export function useMaisonsGestionQuery(params?: MaisonListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: maisonsQueryKeys.list(params),
    queryFn: () => maisonsApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

function invalidateMaisons(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["public", "maisons"] }),
    queryClient.invalidateQueries({ queryKey: ["maisons"] }),
  ]);
}

export function useCreateMaisonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMaisonRequest) => maisonsApi.create(body),
    onSuccess: () => invalidateMaisons(queryClient),
  });
}

export function useUpdateMaisonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateMaisonRequest }) => maisonsApi.update(id, body),
    onSuccess: () => invalidateMaisons(queryClient),
  });
}

export function useUpdateStatutMaisonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateStatutMaisonRequest }) => maisonsApi.updateStatut(id, body),
    onSuccess: () => invalidateMaisons(queryClient),
  });
}

export function useDeleteMaisonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => maisonsApi.remove(id),
    onSuccess: () => invalidateMaisons(queryClient),
  });
}
