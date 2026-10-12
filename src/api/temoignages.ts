import { http } from "./http";
import type { ApiSuccessResponse, CreateTemoignageRequest, Temoignage } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/** Récupère les témoignages publiés à afficher sur la page d'accueil (public, pas de pagination). */
export async function getTemoignages(): Promise<Temoignage[]> {
  return unwrap<Temoignage[]>(http.get("/temoignages"));
}

/** Dépôt public d'un témoignage : reste EN_ATTENTE côté serveur jusqu'à validation par un admin. */
export function createTemoignage(body: CreateTemoignageRequest): Promise<Temoignage> {
  return unwrap<Temoignage>(http.post("/temoignages", body));
}
