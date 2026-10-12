import { http } from "./http";
import type { ApiSuccessResponse, TypeEntiteMedia } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface MediaResponse {
  idMedia: number;
  entiteType: TypeEntiteMedia;
  entiteId: number;
  typeMedia: string;
  url: string;
  urlThumbnail: string | null;
  isPrincipal: boolean;
  ordre: number;
}

export interface UploadEchec {
  nomFichier: string;
  motif: string;
}

export interface UploadMultipleResult {
  reussis: MediaResponse[];
  echecs: UploadEchec[];
}

/**
 * Le backend construit les liens avec son domaine public (`app.api-public-url`, ex. https://api.gestimmo.localhost),
 * souvent injoignable depuis le navigateur en développement. On ne garde que le chemin et on le sert depuis la même
 * origine que les appels API (proxy Vite / reverse proxy), ou depuis `VITE_API_BASE_URL` s'il est absolu.
 */
function sameOriginUrl(url: string): string {
  try {
    const { pathname, search } = new URL(url);
    const base = import.meta.env.VITE_API_BASE_URL;
    const origin = base && /^https?:\/\//.test(base) ? new URL(base).origin : "";
    return origin + pathname + search;
  } catch {
    return url;
  }
}

/** Lecture publique des médias d'une entité (COUR, ANNONCE, MAISON, BIEN_SERVICE) : les URLs renvoyées sont absolues. */
export const publicMediasApi = {
  getByEntite: async (entiteType: TypeEntiteMedia, entiteId: number) => {
    const medias = await unwrap<MediaResponse[]>(http.get("/public/medias", { params: { entiteType, entiteId } }));
    return medias.map((m) => ({ ...m, url: sameOriginUrl(m.url), urlThumbnail: m.urlThumbnail && sameOriginUrl(m.urlThumbnail) }));
  },
};

/** Endpoints réservés à ROLE_AGENT / ROLE_ADMIN (`/api/medias`), envoi en multipart/form-data. */
export const mediasApi = {
  /** Liste complète d'une entité, médias privés compris (ex. OFFRE) : les URLs passent par `/api/medias` (cookie de session). */
  getByEntite: async (entiteType: TypeEntiteMedia, entiteId: number) => {
    const medias = await unwrap<MediaResponse[]>(http.get("/medias", { params: { entiteType, entiteId } }));
    return medias.map((m) => ({ ...m, url: sameOriginUrl(m.url), urlThumbnail: m.urlThumbnail && sameOriginUrl(m.urlThumbnail) }));
  },

  delete: (idMedia: number) => unwrap<unknown>(http.delete(`/medias/${idMedia}`)),

  setPrincipal: (idMedia: number) => unwrap<unknown>(http.patch(`/medias/${idMedia}/principal`)),

  /** Jusqu'à 10 fichiers par envoi ; le premier devient la photo principale. */
  uploadMultiple: (entiteType: TypeEntiteMedia, entiteId: number, fichiers: File[], principal = true) => {
    const form = new FormData();
    form.append("entiteType", entiteType);
    form.append("entiteId", String(entiteId));
    form.append("isPrincipal", String(principal));
    fichiers.forEach((f) => form.append("fichiers", f));
    return unwrap<UploadMultipleResult>(http.post("/medias/multiple", form, { headers: { "Content-Type": "multipart/form-data" } }));
  },
};
