import { useState } from "react";
import type { AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { downloadBlob, downloadFile, resolveFilename } from "@/utils/download";
import { ApiError } from "@/api/http";

interface PreviewState {
  key: string;
  title: string;
  blob: Blob;
  filename: string;
}

/**
 * Récupère un document PDF puis l'affiche en aperçu intégré (sans quitter la
 * plateforme) ou le télécharge directement, avec état de chargement et
 * gestion d'erreur (403/404).
 */
export function useDocumentDownload() {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  async function run(key: string, fetcher: () => Promise<AxiosResponse<Blob>>, action: (response: AxiosResponse<Blob>) => void) {
    setPendingKey(key);
    try {
      const response = await fetcher();
      action(response);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'accéder à ce document.");
    } finally {
      setPendingKey(null);
    }
  }

  function download(key: string, fetcher: () => Promise<AxiosResponse<Blob>>, filename: string) {
    return run(key, fetcher, (response) => downloadFile(response, filename));
  }

  function openPreview(key: string, fetcher: () => Promise<AxiosResponse<Blob>>, title: string, filename: string) {
    return run(key, fetcher, (response) => setPreview({ key, title, blob: response.data, filename: resolveFilename(response, filename) }));
  }

  function closePreview() {
    setPreview(null);
  }

  function downloadPreview() {
    if (preview) downloadBlob(preview.blob, preview.filename);
  }

  return { download, openPreview, closePreview, downloadPreview, preview, isPending: (key: string) => pendingKey === key };
}
