import { http } from "./http";
import type { ApiSuccessResponse, PageParams, PagedResponse, PaysResponse, SecteurResponse, VilleResponse } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface PaysBody {
  codePays: string;
  nomPays: string;
}

export interface VilleBody {
  idPays: number;
  codeVille: string;
  nomVille: string;
}

export interface SecteurBody {
  idVille: number;
  codeSecteur: string;
  nomSecteur: string;
}

export interface VilleAdminListParams extends PageParams {
  idPays?: number;
}

export interface SecteurAdminListParams extends PageParams {
  idVille?: number;
  /** Recherche serveur (nom, code ou ville du secteur). */
  recherche?: string;
}

/** Lecture sur les routes publiques, écriture sur les routes réservées à ROLE_ADMIN / ROLE_AGENT (suppression : ROLE_ADMIN). */
export const localisationApi = {
  getPays: (params?: PageParams) => unwrap<PagedResponse<PaysResponse>>(http.get("/public/pays", { params })),
  createPays: (body: PaysBody) => unwrap<PaysResponse>(http.post("/pays", body)),
  updatePays: (id: number, body: PaysBody) => unwrap<PaysResponse>(http.put(`/pays/${id}`, body)),
  removePays: (id: number) => unwrap<void>(http.delete(`/pays/${id}`)),

  getVilles: (params?: VilleAdminListParams) => unwrap<PagedResponse<VilleResponse>>(http.get("/public/villes", { params })),
  createVille: (body: VilleBody) => unwrap<VilleResponse>(http.post("/villes", body)),
  updateVille: (id: number, body: VilleBody) => unwrap<VilleResponse>(http.put(`/villes/${id}`, body)),
  removeVille: (id: number) => unwrap<void>(http.delete(`/villes/${id}`)),

  getSecteurs: (params?: SecteurAdminListParams) => unwrap<PagedResponse<SecteurResponse>>(http.get("/public/secteurs", { params })),
  createSecteur: (body: SecteurBody) => unwrap<SecteurResponse>(http.post("/secteurs", body)),
  updateSecteur: (id: number, body: SecteurBody) => unwrap<SecteurResponse>(http.put(`/secteurs/${id}`, body)),
  removeSecteur: (id: number) => unwrap<void>(http.delete(`/secteurs/${id}`)),
};
