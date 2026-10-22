import { http } from "./http";
import type { AnnonceResponse, ApiSuccessResponse, CreateAnnonceRequest, UpdateAnnonceRequest, UpdateStatutAnnonceRequest } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/** Mutations ROLE_AGENT/ROLE_ADMIN — la lecture passe par `publicApi.getAnnonces` (pas de GET dédié agent). */
export const annoncesApi = {
  create: (body: CreateAnnonceRequest) => unwrap<AnnonceResponse>(http.post("/annonces", body)),
  update: (id: number, body: UpdateAnnonceRequest) => unwrap<AnnonceResponse>(http.put(`/annonces/${id}`, body)),
  updateStatut: (id: number, body: UpdateStatutAnnonceRequest) => unwrap<AnnonceResponse>(http.patch(`/annonces/${id}/statut`, body)),
  /** Suppression logique, ROLE_ADMIN uniquement. */
  remove: (id: number) => unwrap<null>(http.delete(`/annonces/${id}`)),
};
