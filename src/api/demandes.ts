import { http } from "./http";
import type { ApiSuccessResponse, DemandeResponse, PageParams, PagedResponse, StatutDemande, UpdateStatutDemandeRequest } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface DemandeListParams extends PageParams {
  /** Recherche serveur (nom, email, type de bien, lieu, description). */
  recherche?: string;
  statut?: StatutDemande;
}

export const demandesApi = {
  getDemandes: (params?: DemandeListParams) => unwrap<PagedResponse<DemandeResponse>>(http.get("/demandes", { params })),
  getDemande: (id: number) => unwrap<DemandeResponse>(http.get(`/demandes/${id}`)),
  updateStatut: (id: number, body: UpdateStatutDemandeRequest) => unwrap<DemandeResponse>(http.patch(`/demandes/${id}/statut`, body)),
};
