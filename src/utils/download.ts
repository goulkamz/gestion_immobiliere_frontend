import type { AxiosResponse } from "axios";

function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

/** Résout le nom de fichier d'une réponse blob à partir de l'en-tête `Content-Disposition`, avec repli. */
export function resolveFilename(response: AxiosResponse<Blob>, fallback: string): string {
  return filenameFromDisposition(response.headers["content-disposition"] as string | undefined, fallback);
}

/** Déclenche le téléchargement d'un blob (PDF de document) déjà en mémoire. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Déclenche le téléchargement d'une réponse blob (PDF de document) reçue d'axios. */
export function downloadFile(response: AxiosResponse<Blob>, fallbackFilename: string): void {
  downloadBlob(response.data, resolveFilename(response, fallbackFilename));
}
