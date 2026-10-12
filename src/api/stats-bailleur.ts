import { http } from "./http";
import type { ApiSuccessResponse, BailleurPatrimoineDTO, BailleurRevenuDTO } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export const statsBailleurApi = {
  getPatrimoine: () => unwrap<BailleurPatrimoineDTO>(http.get("/stats/bailleur/patrimoine")),
  getRevenus: () => unwrap<BailleurRevenuDTO[]>(http.get("/stats/bailleur/revenus")),
};
