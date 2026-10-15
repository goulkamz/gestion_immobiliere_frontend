import type { AxiosResponse } from "axios";
import { http } from "./http";

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

  avenant: (idAvenant: number): Promise<AxiosResponse<Blob>> =>
    http.get(`/documents/avenants/${idAvenant}`, { responseType: "blob" }),
};
