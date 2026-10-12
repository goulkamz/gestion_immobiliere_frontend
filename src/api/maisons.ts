import { http } from "./http";
import type { MaisonListParams } from "./public";
import type {
  ApiSuccessResponse,
  CreateMaisonRequest,
  MaisonResponse,
  PagedResponse,
  UpdateMaisonRequest,
  UpdateStatutMaisonRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/**
 * Endpoints authentifiés, distincts du catalogue public (`api/public.ts`) qui ne montre que les maisons
 * disponibles dont la cour a un mandat actif GESTION/LOCATION. Les lectures ici sont sans cette règle :
 * l'agent/admin voit tout, le bailleur uniquement ses propres cours.
 */
export const maisonsApi = {
  list: (params?: MaisonListParams) => unwrap<PagedResponse<MaisonResponse>>(http.get("/maisons", { params })),

  create: (body: CreateMaisonRequest) => unwrap<MaisonResponse>(http.post("/maisons", body)),
  update: (id: number, body: UpdateMaisonRequest) => unwrap<MaisonResponse>(http.put(`/maisons/${id}`, body)),
  updateStatut: (id: number, body: UpdateStatutMaisonRequest) => unwrap<MaisonResponse>(http.patch(`/maisons/${id}/statut`, body)),
  remove: (id: number) => unwrap<void>(http.delete(`/maisons/${id}`)),
};
