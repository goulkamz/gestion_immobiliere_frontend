import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paiementsApi } from "@/api/paiements";
import type { CreatePaiementRequest } from "@/api/types";

export function useCreatePaiementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePaiementRequest) => paiementsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["echeances"] }),
  });
}
