import { http } from "./http";
import type {
  ApiSuccessResponse,
  ConfirmerLocationRequest,
  CreateLocationBienServiceRequest,
  CreerRemboursementRequest,
  LocationBienServiceResponse,
  ModifierDureeLocationRequest,
  ModifierDureeLocationResponse,
  PageParams,
  PagedResponse,
  RemboursementResponse,
  StatutLocationBienService,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface LocationListParams extends PageParams {
  /** Recherche serveur (bien, client, destination). */
  recherche?: string;
  statut?: StatutLocationBienService;
}

export const locationsApi = {
  getLocations: (params?: LocationListParams) =>
    unwrap<PagedResponse<LocationBienServiceResponse>>(http.get("/locations-biens-services", { params })),

  getLocation: (id: number) => unwrap<LocationBienServiceResponse>(http.get(`/locations-biens-services/${id}`)),

  create: (body: CreateLocationBienServiceRequest) =>
    unwrap<LocationBienServiceResponse>(http.post("/locations-biens-services", body)),

  confirmer: (id: number, body: ConfirmerLocationRequest) =>
    unwrap<LocationBienServiceResponse>(http.patch(`/locations-biens-services/${id}/confirmer`, body)),

  annuler: (id: number) => unwrap<LocationBienServiceResponse>(http.patch(`/locations-biens-services/${id}/annuler`)),

  modifierDuree: (id: number, body: ModifierDureeLocationRequest) =>
    unwrap<ModifierDureeLocationResponse>(http.patch(`/locations-biens-services/${id}/duree`, body)),

  rembourser: (id: number, body: CreerRemboursementRequest) =>
    unwrap<RemboursementResponse>(http.post(`/locations-biens-services/${id}/rembourser`, body)),

  updateStatut: (id: number, statut: StatutLocationBienService) =>
    unwrap<LocationBienServiceResponse>(http.patch(`/locations-biens-services/${id}/statut`, { statut })),

  getRemboursements: (id: number) =>
    unwrap<RemboursementResponse[]>(http.get(`/locations-biens-services/${id}/remboursements`)),
};
