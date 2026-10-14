import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { echeancesApi, type EcheanceListParams } from "@/api/echeances";
import type { ConfirmerVirementRequest } from "@/api/types";

export const echeancesQueryKeys = {
  list: (params?: EcheanceListParams) => ["echeances", params] as const,
  enRetardLocation: () => ["echeances", "en-retard-location"] as const,
  enRetardMandat: () => ["echeances", "en-retard-mandat"] as const,
  enAttenteMandat: (idMandat: number) => ["echeances", "mandats", idMandat, "en-attente"] as const,
};

export function useEcheancesQuery(params?: EcheanceListParams) {
  return useQuery({
    queryKey: echeancesQueryKeys.list(params),
    queryFn: () => echeancesApi.getEcheances(params),
    placeholderData: keepPreviousData,
  });
}

/** Compteurs par statut (total, payé, en retard, en attente) : une requête d'une ligne par statut, on lit seulement totalElements. */
export function useEcheancesCompteurs(params: Omit<EcheanceListParams, "statut" | "page" | "size" | "sort">) {
  const results = useQueries({
    queries: ([undefined, "PAYE", "EN_RETARD", "EN_ATTENTE"] as const).map((statut) => {
      const p: EcheanceListParams = { ...params, statut, page: 0, size: 1 };
      return {
        queryKey: echeancesQueryKeys.list(p),
        queryFn: () => echeancesApi.getEcheances(p),
        placeholderData: keepPreviousData,
      };
    }),
  });
  const [total, paye, retard, attente] = results.map((r) => r.data?.page.totalElements);
  const pret = [total, paye, retard, attente].every((n) => n !== undefined);
  return {
    loading: !pret,
    total: total ?? 0,
    paye: paye ?? 0,
    retard: retard ?? 0,
    attente: attente ?? 0,
  };
}

export function useEcheancesEnRetardLocationQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: echeancesQueryKeys.enRetardLocation(),
    queryFn: () => echeancesApi.getEcheancesEnRetardLocation(),
    enabled: options?.enabled ?? true,
  });
}

export function useEcheancesEnRetardMandatQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: echeancesQueryKeys.enRetardMandat(),
    queryFn: () => echeancesApi.getEcheancesEnRetardMandat(),
    enabled: options?.enabled ?? true,
  });
}

export function useReversementsEnAttenteQuery(idMandat: number | null) {
  return useQuery({
    queryKey: echeancesQueryKeys.enAttenteMandat(idMandat ?? 0),
    queryFn: () => echeancesApi.getReversementsEnAttente(idMandat as number),
    enabled: idMandat !== null,
  });
}

export function useCalculerReversementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idMandat, periode }: { idMandat: number; periode: string }) => echeancesApi.calculerReversement(idMandat, periode),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: echeancesQueryKeys.enAttenteMandat(variables.idMandat) });
      queryClient.invalidateQueries({ queryKey: echeancesQueryKeys.enRetardMandat() });
    },
  });
}

export function useCalculerReversementsTousMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periode }: { periode: string }) => echeancesApi.calculerReversementsTous(periode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echeances"] });
    },
  });
}

export function useCalculerCumulMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idMandat, jusquA }: { idMandat: number; jusquA: string }) => echeancesApi.calculerCumul(idMandat, jusquA),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echeances"] });
    },
  });
}

export function useCalculerCumulTousMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jusquA }: { jusquA: string }) => echeancesApi.calculerCumulTous(jusquA),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echeances"] });
    },
  });
}

export function useConfirmerVirementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEcheance, body }: { idEcheance: number; body: ConfirmerVirementRequest }) =>
      echeancesApi.confirmerVirement(idEcheance, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echeances"] });
    },
  });
}
