import { http } from "./http";
import type {
  ApiSuccessResponse,
  ConfirmerVirementRequest,
  EcheanceMandatResponse,
  EcheanceResponse,
  ModeFacturation,
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
  /** Agent/admin : mode de facturation du mandat (échéances de mandat seulement). */
  modeFacturation?: ModeFacturation;
}

/** Résultat du calcul groupé des reversements (tous les mandats actifs, traité côté serveur). */
export interface CalculGroupeMandatsResponse {
  total: number;
  succes: number;
  ignores: number;
  raisons: { message: string; nombre: number }[];
}

/** Résultat du calcul cumulé d'un mandat : une échéance MANDAT par mois, du début du mandat jusqu'au mois choisi. */
export interface CalculCumulResponse {
  idMandat: number;
  nombreMois: number;
  montantLoyersDus: number;
  commissionDeduite: number;
  montantNetAReverser: number;
  echeances: EcheanceMandatResponse[];
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
  calculerCumul: (idMandat: number, jusquA: string) =>
    unwrap<CalculCumulResponse>(http.post(`/echeances/mandats/${idMandat}/calculer-cumul`, null, { params: { jusquA } })),
  calculerCumulTous: (jusquA: string) =>
    unwrap<CalculGroupeMandatsResponse>(http.post("/echeances/mandats/calculer-cumul", null, { params: { jusquA } })),
  getReversementsEnAttente: (idMandat: number) =>
    unwrap<EcheanceMandatResponse[]>(http.get(`/echeances/mandats/${idMandat}/en-attente`)),
  confirmerVirement: (idEcheance: number, body: ConfirmerVirementRequest) =>
    unwrap<EcheanceMandatResponse>(http.patch(`/echeances/${idEcheance}/confirmer-virement`, body)),
};
