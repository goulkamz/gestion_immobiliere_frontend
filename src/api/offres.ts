import { http } from "./http";
import type { ApiSuccessResponse, OffreResponse, PageParams, PagedResponse, StatutOffre, UpdateStatutOffreRequest, VilleFiltreParams } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface OffreListParams extends PageParams, VilleFiltreParams {
  /** Recherche serveur (nom, email, titre, adresse, type). */
  recherche?: string;
  statut?: StatutOffre;
}

export const offresApi = {
  getOffres: (params?: OffreListParams) => unwrap<PagedResponse<OffreResponse>>(http.get("/offres", { params })),
  getOffre: (id: number) => unwrap<OffreResponse>(http.get(`/offres/${id}`)),
  updateStatut: (id: number, body: UpdateStatutOffreRequest) => unwrap<OffreResponse>(http.patch(`/offres/${id}/statut`, body)),
};
