import { http } from "./http";
import type {
  ApiSuccessResponse,
  BienServiceResponse,
  CreateBienServiceRequest,
  UpdateBienServiceRequest,
  UpdateDisponibiliteBienServiceRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/**
 * Mutations ROLE_AGENT/ROLE_ADMIN. Pas de GET ici : l'endpoint authentifié n'en expose
 * aucun — la lecture (liste/détail) passe par `publicApi.getBiensServices`/`getBienService`
 * (`/api/public/biens-services`, mêmes champs, accès public).
 */
export const biensServicesApi = {
  create: (body: CreateBienServiceRequest) => unwrap<BienServiceResponse>(http.post("/biens-services", body)),
  update: (id: number, body: UpdateBienServiceRequest) => unwrap<BienServiceResponse>(http.put(`/biens-services/${id}`, body)),
  updateDisponibilite: (id: number, body: UpdateDisponibiliteBienServiceRequest) =>
    unwrap<BienServiceResponse>(http.patch(`/biens-services/${id}/disponibilite`, body)),
  remove: (id: number) => unwrap<void>(http.delete(`/biens-services/${id}`)),
};
