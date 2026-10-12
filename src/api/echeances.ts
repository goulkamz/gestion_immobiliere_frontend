import { http } from "./http";
import type {
  ApiSuccessResponse,
  ConfirmerVirementRequest,
  EcheanceMandatResponse,
  EcheanceResponse,
  PageParams,
  PagedResponse,
  StatutEcheance,
  TypeEcheance,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface EcheanceListParams extends PageParams {
  type?: TypeEcheance;
  entiteId?: number;
  statut?: StatutEcheance;
  /** Agent/admin : recherche serveur (maison, locataire, cour, propriétaire, mois). */
  recherche?: string;
  /** Agent/admin : référence de cour (échéances de mandat). */
  referenceCour?: string;
  /** Agent/admin : mois au format yyyy-MM. */
  periode?: string;
}

/** Résultat du calcul groupé des reversements (tous les mandats actifs, traité côté serveur). */
export interface CalculGroupeMandatsResponse {
  total: number;
  succes: number;
  ignores: number;
  raisons: { message: string; nombre: number }[];
}

export const echeancesApi = {
  getEcheances: (params?: EcheanceListParams) =>
    unwrap<PagedResponse<EcheanceResponse>>(http.get("/echeances", { params })),
  getEcheancesEnRetardLocation: () => unwrap<EcheanceResponse[]>(http.get("/echeances/en-retard-location")),
  getEcheancesEnRetardMandat: () => unwrap<EcheanceMandatResponse[]>(http.get("/echeances/en-retard-mandat")),
  calculerReversement: (idMandat: number, periode: string) =>
    unwrap<EcheanceMandatResponse>(http.post(`/echeances/mandats/${idMandat}/calculer`, null, { params: { periode } })),
  calculerReversementsTous: (periode: string) =>
    unwrap<CalculGroupeMandatsResponse>(http.post("/echeances/mandats/calculer", null, { params: { periode } })),
  getReversementsEnAttente: (idMandat: number) =>
    unwrap<EcheanceMandatResponse[]>(http.get(`/echeances/mandats/${idMandat}/en-attente`)),
  confirmerVirement: (idEcheance: number, body: ConfirmerVirementRequest) =>
    unwrap<EcheanceMandatResponse>(http.patch(`/echeances/${idEcheance}/confirmer-virement`, body)),
};
