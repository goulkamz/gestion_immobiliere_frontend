import { http } from "./http";
import type {
  ApiSuccessResponse,
  CreateDepenseRequest,
  DepenseImputationResponse,
  DepenseResponse,
  MandatEchuDepenses,
  PageParams,
  PagedResponse,
  ReechelonnerDepenseRequest,
  ReglementDepenseRequest,
  StatutDepense,
  UpdateDepenseRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface DepenseListParams extends PageParams {
  idCour?: number;
  idMaison?: number;
  idMandat?: number;
  statut?: StatutDepense;
  /** Texte libre : libellé, prestataire, référence de la cour, maison, nom du bailleur. */
  recherche?: string;
}

/** Dépenses à la charge du bailleur, retenues sur les reversements de son mandat de gestion. */
export const depensesApi = {
  // Bailleur : toujours limité à ses propres cours côté serveur.
  list: (params?: DepenseListParams) => unwrap<PagedResponse<DepenseResponse>>(http.get("/depenses", { params })),

  /** Détail avec la liste des retenues déjà faites. */
  get: (id: number) => unwrap<DepenseResponse>(http.get(`/depenses/${id}`)),

  /** Retenues faites sur un reversement (échéance MANDAT). */
  getRetenuesReversement: (idEcheance: number) =>
    unwrap<DepenseImputationResponse[]>(http.get(`/depenses/reversements/${idEcheance}`)),

  create: (body: CreateDepenseRequest) => unwrap<DepenseResponse>(http.post("/depenses", body)),

  update: (id: number, body: UpdateDepenseRequest) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}`, body)),

  annuler: (id: number, motif: string) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}/annuler`, { motif })),

  /** Étale le solde restant sur un autre nombre de reversements (raccourcir demande l'accord du bailleur). */
  reechelonner: (id: number, body: ReechelonnerDepenseRequest) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}/reechelonner`, body)),

  /** Règlement direct du bailleur pour une dépense due après la résiliation du mandat. */
  enregistrerReglement: (id: number, body: ReglementDepenseRequest) => unwrap<DepenseResponse>(http.post(`/depenses/${id}/reglements`, body)),

  /** Annule un règlement saisi par erreur : il est conservé mais ne compte plus, la dette réapparaît. */
  annulerReglement: (id: number, idReglement: number, motif: string) =>
    unwrap<DepenseResponse>(http.patch(`/depenses/${id}/reglements/${idReglement}/annuler`, { motif })),

  /** Abandon de créance sur le reste dû (admin) : la dépense est soldée, l'abandon reste tracé. */
  abandonner: (id: number, motif: string) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}/abandon`, { motif })),

  /** Rétablit une créance abandonnée par erreur (admin) : le montant redevient dû, l'abandon reste dans l'historique. */
  retablirCreance: (id: number, motif: string) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}/abandon/retablir`, { motif })),

  /** Bailleur : signale qu'il conteste la dépense (une seule fois) ; rien n'est annulé automatiquement. */
  contester: (id: number, motif: string) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}/contester`, { motif })),

  /** Agence : répond à la contestation du bailleur et la clôt. */
  repondreContestation: (id: number, motif: string) => unwrap<DepenseResponse>(http.patch(`/depenses/${id}/contestation/repondre`, { motif })),

  /** Mandats actifs dont la date de fin est dépassée et qui portent encore des dépenses en cours. */
  mandatsEchus: () => unwrap<MandatEchuDepenses[]>(http.get("/depenses/mandats-echus")),
};
