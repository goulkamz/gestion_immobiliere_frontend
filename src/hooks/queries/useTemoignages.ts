import { useMutation, useQuery } from "@tanstack/react-query";
import { createTemoignage, getTemoignages } from "@/api/temoignages";
import type { CreateTemoignageRequest } from "@/api/types";

export const temoignageQueryKeys = {
  list: ["temoignages"] as const,
};

export function useTemoignagesQuery() {
  return useQuery({
    queryKey: temoignageQueryKeys.list,
    queryFn: getTemoignages,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTemoignageMutation() {
  return useMutation({
    mutationFn: (body: CreateTemoignageRequest) => createTemoignage(body),
  });
}
