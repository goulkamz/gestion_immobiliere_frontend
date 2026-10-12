import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { temoignagesAdminApi, type TemoignageAdminListParams } from "@/api/temoignages-admin";
import type { CreateTemoignageAdminRequest, UpdateStatutTemoignageRequest } from "@/api/types";
import { temoignageQueryKeys } from "./useTemoignages";

export const temoignageAdminQueryKeys = {
  list: (params?: TemoignageAdminListParams) => ["temoignages-admin", params] as const,
};

export function useAdminTemoignagesQuery(params?: TemoignageAdminListParams) {
  return useQuery({
    queryKey: temoignageAdminQueryKeys.list(params),
    queryFn: () => temoignagesAdminApi.getAll(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateStatutTemoignageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateStatutTemoignageRequest }) => temoignagesAdminApi.updateStatut(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temoignages-admin"] });
      queryClient.invalidateQueries({ queryKey: temoignageQueryKeys.list });
    },
  });
}

export function useCreateAdminTemoignageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTemoignageAdminRequest) => temoignagesAdminApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temoignages-admin"] });
      queryClient.invalidateQueries({ queryKey: temoignageQueryKeys.list });
    },
  });
}
