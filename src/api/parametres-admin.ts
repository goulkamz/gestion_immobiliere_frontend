import { http } from "./http";
import type { ApiSuccessResponse, ParametreResponse } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/** Tous les paramètres système (ROLE_ADMIN). La clé et le type ne sont jamais modifiables, seule la valeur l'est. */
export const parametresAdminApi = {
  getAll: () => unwrap<ParametreResponse[]>(http.get("/parametres")),
  update: (cle: string, valeur: string) => unwrap<ParametreResponse>(http.patch(`/parametres/${encodeURIComponent(cle)}`, { valeur })),
};
