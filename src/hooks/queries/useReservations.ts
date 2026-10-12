import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservationsApi, type ReservationListParams } from "@/api/reservations";
import type { ConvertirReservationParams, CreateReservationRequest } from "@/api/types";

export const reservationsQueryKeys = {
  list: (params?: ReservationListParams) => ["reservations", params] as const,
  detail: (id: number) => ["reservations", id] as const,
};

export function useReservationsQuery(params?: ReservationListParams) {
  return useQuery({
    queryKey: reservationsQueryKeys.list(params),
    queryFn: () => reservationsApi.getReservations(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReservationRequest) => reservationsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useAnnulerReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservationsApi.annuler(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["public", "maisons"] });
    },
  });
}

export function useConfirmerReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservationsApi.confirmer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useConvertirReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: number; params: ConvertirReservationParams }) => reservationsApi.convertir(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["contrats-location"] });
      queryClient.invalidateQueries({ queryKey: ["public", "maisons"] });
    },
  });
}
