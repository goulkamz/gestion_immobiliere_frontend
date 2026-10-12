import { http } from "./http";
import type { ApiSuccessResponse, ClientEcheanceDTO, ClientLocationDTO, ClientRemboursementDTO } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/** Vues déjà agrégées/filtrées côté serveur pour le client connecté (§15). */
export const statsClientApi = {
  getLocations: () => unwrap<ClientLocationDTO[]>(http.get("/stats/client/locations")),

  getEcheances: () => unwrap<ClientEcheanceDTO[]>(http.get("/stats/client/echeances")),

  getRemboursements: () => unwrap<ClientRemboursementDTO[]>(http.get("/stats/client/remboursements")),
};
