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
  VilleFiltreParams,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface LocationListParams extends PageParams, VilleFiltreParams {
  /** Recherche serveur (bien, client, destination). */
  recherche?: string;
  statut?: StatutLocationBienService;
  /** Locations ACTIF qui se terminent bientôt ou sont échues. */
  aEcheance?: boolean;
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

  updateStatut: (id: number, statut: StatutLocationBienService, raccourcir?: boolean) =>
    unwrap<LocationBienServiceResponse>(http.patch(`/locations-biens-services/${id}/statut`, { statut, raccourcir })),

  getRemboursements: (id: number) =>
    unwrap<RemboursementResponse[]>(http.get(`/locations-biens-services/${id}/remboursements`)),
};
