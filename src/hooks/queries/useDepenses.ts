import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { depensesApi, type DepenseListParams } from "@/api/depenses";
import type { CreateDepenseRequest, ReechelonnerDepenseRequest, ReglementDepenseRequest, UpdateDepenseRequest } from "@/api/types";

export function useDepensesQuery(params?: DepenseListParams) {
  return useQuery({
    queryKey: ["depenses", params] as const,
    queryFn: () => depensesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Détail d'une dépense, avec ses retenues reversement par reversement. */
export function useDepenseQuery(id: number | null) {
  return useQuery({
    queryKey: ["depenses", "detail", id] as const,
    queryFn: () => depensesApi.get(id as number),
    enabled: id !== null,
  });
}

/** Retenues faites sur un reversement. */
export function useRetenuesReversementQuery(idEcheance: number | null) {
  return useQuery({
    queryKey: ["depenses", "reversement", idEcheance] as const,
    queryFn: () => depensesApi.getRetenuesReversement(idEcheance as number),
    enabled: idEcheance !== null,
  });
}

export function useCreateDepenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDepenseRequest) => depensesApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useUpdateDepenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDepenseRequest }) => depensesApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useAnnulerDepenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => depensesApi.annuler(id, motif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useReechelonnerDepenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReechelonnerDepenseRequest }) => depensesApi.reechelonner(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useAnnulerReglementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idReglement, motif }: { id: number; idReglement: number; motif: string }) => depensesApi.annulerReglement(id, idReglement, motif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useAbandonnerDepenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => depensesApi.abandonner(id, motif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

function useDepenseMotifMutation(action: (id: number, motif: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => action(id, motif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useRetablirCreanceMutation() {
  return useDepenseMotifMutation(depensesApi.retablirCreance);
}

export function useContesterDepenseMutation() {
  return useDepenseMotifMutation(depensesApi.contester);
}

export function useRepondreContestationMutation() {
  return useDepenseMotifMutation(depensesApi.repondreContestation);
}

/** Mandats échus (toujours actifs) avec des dépenses en cours : à résilier ou prolonger. */
export function useMandatsEchusQuery() {
  return useQuery({
    queryKey: ["depenses", "mandats-echus"] as const,
    queryFn: () => depensesApi.mandatsEchus(),
  });
}

export function useReglementDepenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReglementDepenseRequest }) => depensesApi.enregistrerReglement(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["depenses"] }),
  });
}
