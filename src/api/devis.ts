import { http } from "./http";
import type { AxiosResponse } from "axios";
import type {
  AccordHorsPlateformeRequest,
  ApiSuccessResponse,
  CreateDevisRequest,
  DevisResponse,
  PageParams,
  PagedResponse,
  StatutDevis,
  UpdateDevisRequest,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface DevisListParams extends PageParams {
  idCour?: number;
  statut?: StatutDevis;
  /** Texte libre : libellé, prestataire, référence de la cour, maison, nom du bailleur. */
  recherche?: string;
}

/** Devis de travaux soumis au bailleur : l'agence propose, le bailleur accepte, demande une renégociation ou rejette. */
export const devisApi = {
  // Bailleur : toujours limité à ses propres cours côté serveur.
  list: (params?: DevisListParams) => unwrap<PagedResponse<DevisResponse>>(http.get("/devis", { params })),

  get: (id: number) => unwrap<DevisResponse>(http.get(`/devis/${id}`)),

  // ---- Agence ----
  create: (body: CreateDevisRequest) => unwrap<DevisResponse>(http.post("/devis", body)),

  /** Correction avant réponse, ou révision après une demande de renégociation (le devis est alors soumis à nouveau). */
  update: (id: number, body: UpdateDevisRequest) => unwrap<DevisResponse>(http.patch(`/devis/${id}`, body)),

  annuler: (id: number, commentaire: string) => unwrap<DevisResponse>(http.patch(`/devis/${id}/annuler`, { commentaire })),

  /** Enregistre la dépense d'un devis accepté ; le montant ne dépasse jamais celui du devis. */
  enregistrerDepense: (id: number, body: { dateDepense?: string; montant?: number }) =>
    unwrap<DevisResponse>(http.post(`/devis/${id}/depense`, body)),

  /** Accord donné par le bailleur hors plateforme (téléphone, en personne) : le devis passe à « accepté » et le bailleur peut le contester. */
  accordHorsPlateforme: (id: number, body: AccordHorsPlateformeRequest) =>
    unwrap<DevisResponse>(http.patch(`/devis/${id}/accord-hors-plateforme`, body)),

  /** Joint (ou remplace) le devis PDF de l'artisan : 10 Mo au plus, PDF uniquement. */
  joindrePieceJointe: (id: number, fichier: File) => {
    const form = new FormData();
    form.append("fichier", fichier);
    return unwrap<null>(http.post(`/devis/${id}/piece-jointe`, form, { headers: { "Content-Type": "multipart/form-data" } }));
  },

  retirerPieceJointe: (id: number) => unwrap<null>(http.delete(`/devis/${id}/piece-jointe`)),

  /** Devis PDF joint (agence et bailleur de la cour) : réponse binaire brute. */
  pieceJointe: (id: number): Promise<AxiosResponse<Blob>> => http.get(`/devis/${id}/piece-jointe`, { responseType: "blob" }),

  // ---- Bailleur ----
  /** Le bailleur ne reconnaît pas l'accord que l'agence a enregistré hors plateforme : le devis repart en renégociation. */
  contesterAccord: (id: number, commentaire: string) => unwrap<DevisResponse>(http.patch(`/devis/${id}/contester-accord`, { commentaire })),

  /** Le montant et l'étalement affichés sont renvoyés : l'accord est refusé (409) si le devis a changé entre-temps. */
  accepter: (id: number, body: { montant: number; nombreMois: number }) => unwrap<DevisResponse>(http.patch(`/devis/${id}/accepter`, body)),

  renegocier: (id: number, commentaire: string) => unwrap<DevisResponse>(http.patch(`/devis/${id}/renegocier`, { commentaire })),

  rejeter: (id: number, commentaire: string) => unwrap<DevisResponse>(http.patch(`/devis/${id}/rejeter`, { commentaire })),
};
