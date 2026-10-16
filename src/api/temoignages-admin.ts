import { http } from "./http";
import type {
  ApiSuccessResponse,
  CreateTemoignageAdminRequest,
  PageParams,
  PagedResponse,
  TemoignageAdminResponse,
  TemoignageStatut,
  UpdateStatutTemoignageRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface TemoignageAdminListParams extends PageParams {
  statut?: TemoignageStatut;
}

export const temoignagesAdminApi = {
  getAll: (params?: TemoignageAdminListParams) =>
    unwrap<PagedResponse<TemoignageAdminResponse>>(http.get("/admin/temoignages", { params })),
  getOne: (id: number) => unwrap<TemoignageAdminResponse>(http.get(`/admin/temoignages/${id}`)),
  updateStatut: (id: number, body: UpdateStatutTemoignageRequest) =>
    unwrap<TemoignageAdminResponse>(http.patch(`/admin/temoignages/${id}/statut`, body)),
  create: (body: CreateTemoignageAdminRequest) =>
    unwrap<TemoignageAdminResponse>(http.post("/admin/temoignages", body)),
};
