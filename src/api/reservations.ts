import { http } from "./http";
import type {
  ApiSuccessResponse,
  ContratLocationResponse,
  ConvertirReservationParams,
  CreateReservationRequest,
  PageParams,
  PagedResponse,
  ReservationResponse,
  StatutReservation,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface ReservationListParams extends PageParams {
  idMaison?: number;
  statut?: StatutReservation;
  /** Recherche serveur (agent/admin) sur le nom de la maison ou du client. */
  recherche?: string;
}

export const reservationsApi = {
  getReservations: (params?: ReservationListParams) =>
    unwrap<PagedResponse<ReservationResponse>>(http.get("/reservations", { params })),

  getReservation: (id: number) => unwrap<ReservationResponse>(http.get(`/reservations/${id}`)),

  create: (body: CreateReservationRequest) => unwrap<ReservationResponse>(http.post("/reservations", body)),

  annuler: (id: number) => unwrap<ReservationResponse>(http.patch(`/reservations/${id}/annuler`)),

  confirmer: (id: number) => unwrap<ReservationResponse>(http.patch(`/reservations/${id}/confirmer`)),

  convertir: (id: number, params: ConvertirReservationParams) =>
    unwrap<ContratLocationResponse>(http.patch(`/reservations/${id}/convertir`, null, { params })),
};
