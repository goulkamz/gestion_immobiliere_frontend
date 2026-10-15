import { http } from "./http";
import type {
  StatutLocation,
  ApiSuccessResponse,
  AvenantResponse,
  ContratLocationResponse,
  DecompteSortieResponse,
  PageParams,
  PagedResponse,
  ReglerDecompteSortieRequest,
  ResilierLocationRequest,
  TerminerLocationRequest,
  UpdateContratLocationRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface ContratLocationListParams extends PageParams {
  idMaison?: number;
  /** Recherche serveur (agent/admin) sur le nom de la maison ou du locataire. */
  recherche?: string;
  /** Agent/admin : filtre serveur sur le statut du contrat. */
  statut?: StatutLocation;
  /** Filtre serveur sur la référence de cour (bailleur, agent). */
  referenceCour?: string;
}

export const contratsApi = {
  getContratsLocation: (params?: ContratLocationListParams) =>
    unwrap<PagedResponse<ContratLocationResponse>>(http.get("/contrats-location", { params })),

  getAvenants: (id: number) => unwrap<AvenantResponse[]>(http.get(`/contrats-location/${id}/avenants`)),

  modifier: (id: number, body: UpdateContratLocationRequest) =>
    unwrap<ContratLocationResponse>(http.patch(`/contrats-location/${id}/modifier`, body)),

  terminer: (id: number, body: TerminerLocationRequest) =>
    unwrap<DecompteSortieResponse>(http.patch(`/contrats-location/${id}/terminer`, body)),

  resilier: (id: number, body: ResilierLocationRequest) =>
    unwrap<DecompteSortieResponse>(http.patch(`/contrats-location/${id}/resilier`, body)),

  getDecompteSortie: (idContrat: number) => unwrap<DecompteSortieResponse>(http.get(`/contrats-location/${idContrat}/decompte-sortie`)),

  reglerDecompteSortie: (idDecompte: number, body: ReglerDecompteSortieRequest) =>
    unwrap<DecompteSortieResponse>(http.patch(`/contrats-location/decomptes-sortie/${idDecompte}/regler`, body)),
};
