import { http } from "./http";
import type { ApiSuccessResponse, CourResponse, CreateCourRequest, PageParams, PagedResponse, UpdateCourRequest } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface CourListParams extends PageParams {
  idSecteur?: number;
  recherche?: string;
  /** Ne renvoie que les cours sans mandat ACTIF. */
  sansMandatActif?: boolean;
}

export const coursApi = {
  getCours: (params?: CourListParams) => unwrap<PagedResponse<CourResponse>>(http.get("/cours", { params })),
  getCour: (id: number) => unwrap<CourResponse>(http.get(`/cours/${id}`)),
  create: (body: CreateCourRequest) => unwrap<CourResponse>(http.post("/cours", body)),
  update: (id: number, body: UpdateCourRequest) => unwrap<CourResponse>(http.put(`/cours/${id}`, body)),
  remove: (id: number) => unwrap<void>(http.delete(`/cours/${id}`)),
};
