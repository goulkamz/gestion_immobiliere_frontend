import type { AxiosResponse } from "axios";
import { http } from "./http";
import type { ApiSuccessResponse } from "./types";

/**
 * Documents PDF (§12) : réponse binaire brute (`application/pdf`), sans
 * l'enveloppe `ApiSuccessResponse` — on retourne la réponse axios complète
 * (headers inclus, pour lire `Content-Disposition` via `downloadFile`).
 */
export const documentsApi = {
  contratMandat: (idMandat: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/contrats-mandat/${idMandat}`, { responseType: "blob" }),

  decompteSortie: (idDecompte: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/decomptes-sortie/${idDecompte}`, { responseType: "blob" }),

  attestationLoyer: (idContrat: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/attestations-loyer/${idContrat}`, { responseType: "blob" }),

  quittance: (idEcheance: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/quittances/${idEcheance}`, { responseType: "blob" }),

  recu: (idPaiement: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/recus/${idPaiement}`, { responseType: "blob" }),

  contratLocation: (idContrat: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/contrats-location/${idContrat}`, { responseType: "blob" }),

  etatDesLieux: (idContrat: number, phase: "entree" | "sortie"): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/etats-des-lieux/${idContrat}/${phase}`, { responseType: "blob" }),

  /** `periode` : AAAA-MM-JJ, seul le mois compte. Mois en cours = rapport provisoire (jamais enregistré). ROLE_ADMIN. */
  rapportMensuel: (periode: string): Promise<AxiosResponse<Blob>> =>
    http.get("/documents/rapports-mensuels", { params: { periode }, responseType: "blob" }),

  /** Premier mois d'activité (AAAA-MM-01) : au-delà vers le passé, un rapport serait vide et figé. ROLE_ADMIN. */
  premierMoisRapport: async (): Promise<string> => {
    const { data } = await http.get<ApiSuccessResponse<{ premierMois: string }>>("/documents/rapports-mensuels/premier-mois");
    return (data.data as { premierMois: string }).premierMois;
  },

  avenant: (idAvenant: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/avenants/${idAvenant}`, { responseType: "blob" }),
};
