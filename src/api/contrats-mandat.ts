import { http } from "./http";
import type {
  ApiSuccessResponse,
  ContratMandatResponse,
  CreateContratMandatRequest,
  PageParams,
  PagedResponse,
  ResilierMandatRequest,
  StatutMandat,
  UpdateContratMandatRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface ContratMandatListParams extends PageParams {
  idCour?: number;
  statut?: StatutMandat;
  recherche?: string;
}

export const contratsMandatApi = {
  // idCour/statut ignorés côté serveur pour un bailleur (toujours filtré sur ses propres cours) ; honorés pour un agent.
  getContratsMandat: (params?: ContratMandatListParams) =>
    unwrap<PagedResponse<ContratMandatResponse>>(http.get("/contrats-mandat", { params })),

  getContratMandat: (id: number) => unwrap<ContratMandatResponse>(http.get(`/contrats-mandat/${id}`)),

  create: (body: CreateContratMandatRequest) => unwrap<ContratMandatResponse>(http.post("/contrats-mandat", body)),

  activer: (id: number) => unwrap<ContratMandatResponse>(http.patch(`/contrats-mandat/${id}/activer`)),

  modifier: (id: number, body: UpdateContratMandatRequest) => unwrap<ContratMandatResponse>(http.patch(`/contrats-mandat/${id}/modifier`, body)),

  // Nom d'URL trompeur côté backend (hérité) : résilie bien le MANDAT, pas une location.
  resilier: (id: number, body: ResilierMandatRequest) =>
    unwrap<ContratMandatResponse>(http.patch(`/contrats-mandat/${id}/resilierContratLocation`, body)),
};
