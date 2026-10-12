import { http } from "./http";
import type { ApiSuccessResponse, DemandeEnAttenteDTO, EcheanceRetardAgentDTO, MesMandatsParStatutDTO, ReservationEnAttenteDTO } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export const statsAgentApi = {
  getDemandesEnAttente: () => unwrap<DemandeEnAttenteDTO[]>(http.get("/stats/agent/demandes-en-attente")),
  getReservationsEnAttente: () => unwrap<ReservationEnAttenteDTO[]>(http.get("/stats/agent/reservations-en-attente")),
  getMesMandats: () => unwrap<MesMandatsParStatutDTO>(http.get("/stats/agent/mes-mandats")),
  getEcheancesRetard: () => unwrap<EcheanceRetardAgentDTO[]>(http.get("/stats/agent/echeances-retard")),
};
