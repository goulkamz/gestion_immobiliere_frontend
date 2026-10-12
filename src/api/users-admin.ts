import { http } from "./http";
import type { ApiSuccessResponse, CreateUserByAdminRequest, PagedResponse, Role, UserAdminResponse } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface UserListParams {
  page?: number;
  size?: number;
  sort?: string;
  /** Recherche serveur (nom, prénom, email, téléphone). */
  recherche?: string;
}

export const usersAdminApi = {
  /** Lecture seule (ROLE_AGENT, ROLE_ADMIN) - sert à peupler des sélecteurs par rôle. */
  getByRole: (role: Role, params?: UserListParams) =>
    unwrap<PagedResponse<UserAdminResponse>>(http.get("/admin/users", { params: { role, size: 1000, ...params } })),
  /** Création de compte (ROLE_ADMIN uniquement) - utile quand un proposant d'offre n'a pas encore de compte. */
  create: (body: CreateUserByAdminRequest) => unwrap<UserAdminResponse>(http.post("/admin/users", body)),
};
