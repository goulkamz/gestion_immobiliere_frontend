import { http } from "./http";
import type { UploadMultipleResult } from "./medias";
import type {
  AnnonceResponse,
  ApiSuccessResponse,
  BienServiceResponse,
  ContactResponse,
  CreateContactRequest,
  CreateDemandeRequest,
  CreateOffreRequest,
  DemandeResponse,
  MaisonResponse,
  OffreDepotResponse,
  PageParams,
  PagedResponse,
  ParametreResponse,
  PublicStatsResponse,
  SecteurResponse,
  StatutAnnonce,
  StatutMaison,
  VilleResponse,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface MaisonListParams extends PageParams {
  idCour?: number;
  statut?: StatutMaison;
  /** Recherche serveur (nom, type, référence de la cour). */
  recherche?: string;
}

export interface SecteurListParams extends PageParams {
  idVille?: number;
  /** Recherche serveur (nom, code ou ville du secteur). */
  recherche?: string;
}

export interface BienServiceListParams extends PageParams {
  idSecteur?: number;
  idCategorie?: number;
  /** Recherche serveur (libellé, catégorie, secteur). */
  recherche?: string;
  /** Filtre serveur sur la disponibilité (drapeau manuel du bien). */
  disponibilite?: "DISPONIBLE" | "RESERVEE" | "LOUEE" | "EN_MAINTENANCE";
}

export interface AnnonceListParams extends PageParams {
  statut?: StatutAnnonce;
  /** Recherche serveur (titre, type, localisation). */
  recherche?: string;
}

export const publicApi = {
  getMaisons: (params?: MaisonListParams) =>
    unwrap<PagedResponse<MaisonResponse>>(http.get("/public/maisons", { params })),

  getMaison: (id: number) => unwrap<MaisonResponse>(http.get(`/public/maisons/${id}`)),

  getBiensServices: (params?: BienServiceListParams) =>
    unwrap<PagedResponse<BienServiceResponse>>(http.get("/public/biens-services", { params })),

  getBienService: (id: number) => unwrap<BienServiceResponse>(http.get(`/public/biens-services/${id}`)),

  getAnnonces: (params?: AnnonceListParams) =>
    unwrap<PagedResponse<AnnonceResponse>>(http.get("/public/annonces", { params })),

  getAnnonce: (id: number) => unwrap<AnnonceResponse>(http.get(`/public/annonces/${id}`)),

  getPublicStats: () => unwrap<PublicStatsResponse>(http.get("/stats/public")),

  getRecentAnnonces: () => unwrap<AnnonceResponse[]>(http.get("/stats/public/annonces")),

  getVilles: () => unwrap<PagedResponse<VilleResponse>>(http.get("/public/villes", { params: { size: 50 } })),

  getSecteurs: (params?: SecteurListParams) =>
    unwrap<PagedResponse<SecteurResponse>>(http.get("/public/secteurs", { params })),

  postContact: (body: CreateContactRequest) => unwrap<ContactResponse>(http.post("/public/contacts", body)),

  postDemande: (body: CreateDemandeRequest) => unwrap<DemandeResponse>(http.post("/public/demandes", body)),

  postOffre: (body: CreateOffreRequest) => unwrap<OffreDepotResponse>(http.post("/public/offres", body)),

  /** Envoie les photos d'une offre qui vient d'être déposée, authentifié par le jeton reçu à la création. */
  uploadPhotosOffre: (idOffre: number, jeton: string, fichiers: File[]) => {
    const form = new FormData();
    fichiers.forEach((f) => form.append("fichiers", f));
    return unwrap<UploadMultipleResult>(
      http.post(`/public/offres/${idOffre}/medias`, form, { headers: { "Content-Type": "multipart/form-data", "X-Upload-Token": jeton } }),
    );
  },

  getParametresPublics: () => unwrap<ParametreResponse[]>(http.get("/public/parametres")),
};
