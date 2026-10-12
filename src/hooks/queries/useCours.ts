import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursApi, type CourListParams } from "@/api/cours";
import type { CreateCourRequest, UpdateCourRequest } from "@/api/types";

export const coursQueryKeys = {
  list: (params?: CourListParams) => ["cours", params] as const,
};

export function useCoursQuery(params?: CourListParams) {
  return useQuery({ queryKey: coursQueryKeys.list(params), queryFn: () => coursApi.getCours(params) });
}

export function useCreateCourMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCourRequest) => coursApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cours"] }),
  });
}

export function useUpdateCourMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCourRequest }) => coursApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cours"] }),
  });
}

export function useDeleteCourMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coursApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cours"] }),
  });
}
