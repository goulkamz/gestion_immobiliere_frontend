import { useMutation, useQueryClient } from "@tanstack/react-query";
import { annoncesApi } from "@/api/annonces";
import type { CreateAnnonceRequest, UpdateAnnonceRequest, UpdateStatutAnnonceRequest } from "@/api/types";

/** Pas de hook de lecture ici : la liste vient du catalogue public (`publicApi.getAnnonces`). */
function invalidateAnnonces(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ["public", "annonces"] });
}

export function useCreateAnnonceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAnnonceRequest) => annoncesApi.create(body),
    onSuccess: () => invalidateAnnonces(queryClient),
  });
}

export function useUpdateAnnonceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateAnnonceRequest }) => annoncesApi.update(id, body),
    onSuccess: () => invalidateAnnonces(queryClient),
  });
}

export function useDeleteAnnonceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => annoncesApi.remove(id),
    onSuccess: () => invalidateAnnonces(queryClient),
  });
}

export function useUpdateStatutAnnonceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateStatutAnnonceRequest }) => annoncesApi.updateStatut(id, body),
    onSuccess: () => invalidateAnnonces(queryClient),
  });
}
