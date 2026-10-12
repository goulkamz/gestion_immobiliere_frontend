import { http } from "./http";
import type { ApiSuccessResponse, CategorieResponse, CreateCategorieRequest, PageParams, PagedResponse, UpdateCategorieRequest } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface CategorieListParams extends PageParams {
  /** Recherche serveur (libellé). */
  recherche?: string;
}

export const categoriesApi = {
  getCategories: (params?: CategorieListParams) => unwrap<PagedResponse<CategorieResponse>>(http.get("/categories", { params })),
  getCategorie: (id: number) => unwrap<CategorieResponse>(http.get(`/categories/${id}`)),
  create: (body: CreateCategorieRequest) => unwrap<CategorieResponse>(http.post("/categories", body)),
  update: (id: number, body: UpdateCategorieRequest) => unwrap<CategorieResponse>(http.put(`/categories/${id}`, body)),
  remove: (id: number) => unwrap<void>(http.delete(`/categories/${id}`)),
};
