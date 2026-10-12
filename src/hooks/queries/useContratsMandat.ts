import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contratsMandatApi, type ContratMandatListParams } from "@/api/contrats-mandat";
import type { CreateContratMandatRequest, ResilierMandatRequest, UpdateContratMandatRequest } from "@/api/types";

export const contratsMandatQueryKeys = {
  list: (params?: ContratMandatListParams) => ["contrats-mandat", params] as const,
};

export function useContratsMandatQuery(params?: ContratMandatListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contratsMandatQueryKeys.list(params),
    queryFn: () => contratsMandatApi.getContratsMandat(params),
    enabled: options?.enabled ?? true,
  });
}

export function useContratMandatQuery(id: number | undefined) {
  return useQuery({
    queryKey: ["contrats-mandat", "detail", id] as const,
    queryFn: () => contratsMandatApi.getContratMandat(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateContratMandatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateContratMandatRequest) => contratsMandatApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats-mandat"] }),
  });
}

export function useActiverContratMandatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contratsMandatApi.activer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats-mandat"] }),
  });
}

export function useModifierContratMandatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateContratMandatRequest }) => contratsMandatApi.modifier(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats-mandat"] }),
  });
}

export function useResilierContratMandatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ResilierMandatRequest }) => contratsMandatApi.resilier(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats-mandat"] }),
  });
}
