import { useMutation, useQueryClient } from "@tanstack/react-query";
import { biensServicesApi } from "@/api/biens-services";
import type { CreateBienServiceRequest, UpdateBienServiceRequest, UpdateDisponibiliteBienServiceRequest } from "@/api/types";

/** Pas de hook de lecture ici : la liste/le détail viennent du catalogue public (`usePublicCatalog`). */
function invalidateBiensServices(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ["public", "biens-services"] });
}

export function useCreateBienServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBienServiceRequest) => biensServicesApi.create(body),
    onSuccess: () => invalidateBiensServices(queryClient),
  });
}

export function useUpdateBienServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateBienServiceRequest }) => biensServicesApi.update(id, body),
    onSuccess: () => invalidateBiensServices(queryClient),
  });
}

export function useUpdateDisponibiliteBienServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDisponibiliteBienServiceRequest }) => biensServicesApi.updateDisponibilite(id, body),
    onSuccess: () => invalidateBiensServices(queryClient),
  });
}

export function useDeleteBienServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => biensServicesApi.remove(id),
    onSuccess: () => invalidateBiensServices(queryClient),
  });
}
