import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, type CategorieListParams } from "@/api/categories";
import type { CreateCategorieRequest, UpdateCategorieRequest } from "@/api/types";

export const categoriesQueryKeys = {
  list: (params?: CategorieListParams) => ["categories", params] as const,
};

export function useCategoriesQuery(params?: CategorieListParams) {
  return useQuery({ queryKey: categoriesQueryKeys.list(params), queryFn: () => categoriesApi.getCategories(params), placeholderData: keepPreviousData });
}

export function useCreateCategorieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategorieRequest) => categoriesApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategorieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCategorieRequest }) => categoriesApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategorieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
