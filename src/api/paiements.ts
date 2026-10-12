import { http } from "./http";
import type { ApiSuccessResponse, CreatePaiementRequest, PaiementResponse } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export const paiementsApi = {
  create: (body: CreatePaiementRequest) => unwrap<PaiementResponse>(http.post("/paiements", body)),
  getPaiement: (id: number) => unwrap<PaiementResponse>(http.get(`/paiements/${id}`)),
};
