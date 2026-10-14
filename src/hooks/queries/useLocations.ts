import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locationsApi, type LocationListParams } from "@/api/locations";
import type {
  ConfirmerLocationRequest,
  CreateLocationBienServiceRequest,
  CreerRemboursementRequest,
  ModifierDureeLocationRequest,
  StatutLocationBienService,
} from "@/api/types";

export const locationsQueryKeys = {
  list: (params?: LocationListParams) => ["locations-biens-services", params] as const,
  detail: (id: number) => ["locations-biens-services", id] as const,
  remboursements: (id: number) => ["locations-biens-services", id, "remboursements"] as const,
};

export function useLocationsQuery(params?: LocationListParams) {
  return useQuery({
    queryKey: locationsQueryKeys.list(params),
    queryFn: () => locationsApi.getLocations(params),
    placeholderData: keepPreviousData,
  });
}

export function useLocationRemboursementsQuery(id: number) {
  return useQuery({
    queryKey: locationsQueryKeys.remboursements(id),
    queryFn: () => locationsApi.getRemboursements(id),
    enabled: id > 0,
  });
}

export function useCreateLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLocationBienServiceRequest) => locationsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations-biens-services"] }),
  });
}

export function useAnnulerLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => locationsApi.annuler(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations-biens-services"] }),
  });
}

export function useConfirmerLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ConfirmerLocationRequest }) => locationsApi.confirmer(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations-biens-services"] }),
  });
}

export function useModifierDureeLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ModifierDureeLocationRequest }) => locationsApi.modifierDuree(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations-biens-services"] }),
  });
}

export function useRembourserLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CreerRemboursementRequest }) => locationsApi.rembourser(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations-biens-services"] }),
  });
}

export function useUpdateStatutLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut, raccourcir }: { id: number; statut: StatutLocationBienService; raccourcir?: boolean }) =>
      locationsApi.updateStatut(id, statut, raccourcir),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations-biens-services"] }),
  });
}
