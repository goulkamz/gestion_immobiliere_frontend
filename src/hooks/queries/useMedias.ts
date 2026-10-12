import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { mediasApi, publicMediasApi } from "@/api/medias";
import { toMediaItems } from "@/utils/media";
import { ApiError } from "@/api/http";
import type { TypeEntiteMedia } from "@/api/types";

export function useUploadMediasMutation() {
  return useMutation({
    mutationFn: ({ entiteType, entiteId, fichiers }: { entiteType: TypeEntiteMedia; entiteId: number; fichiers: File[] }) =>
      mediasApi.uploadMultiple(entiteType, entiteId, fichiers),
  });
}

/** Rafraîchit les listes de médias (agence et publiques) après une modification. */
function useInvalidateMedias() {
  const queryClient = useQueryClient();
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: ["agence-medias"] }), queryClient.invalidateQueries({ queryKey: ["public-medias"] })]);
}

export function useDeleteMediaMutation() {
  const invalidate = useInvalidateMedias();
  return useMutation({ mutationFn: (idMedia: number) => mediasApi.delete(idMedia), onSuccess: invalidate });
}

export function useSetPrincipalMediaMutation() {
  const invalidate = useInvalidateMedias();
  return useMutation({ mutationFn: (idMedia: number) => mediasApi.setPrincipal(idMedia), onSuccess: invalidate });
}

export function useAddMediasMutation() {
  const invalidate = useInvalidateMedias();
  return useMutation({
    mutationFn: ({ entiteType, entiteId, fichiers, principal }: { entiteType: TypeEntiteMedia; entiteId: number; fichiers: File[]; principal: boolean }) =>
      mediasApi.uploadMultiple(entiteType, entiteId, fichiers, principal),
    onSuccess: invalidate,
  });
}

/**
 * Joint des photos à une entité qui vient d'être créée. Ne lève jamais : l'entité existe déjà, un échec d'envoi
 * est signalé par un avertissement et les photos pourront être rajoutées plus tard.
 */
export function useAttachPhotos() {
  const upload = useUploadMediasMutation();
  const attach = async (entiteType: TypeEntiteMedia, entiteId: number, fichiers: File[]) => {
    if (fichiers.length === 0) return;
    try {
      const { echecs } = await upload.mutateAsync({ entiteType, entiteId, fichiers });
      if (echecs.length > 0) toast.warning(`${echecs.length} photo(s) non envoyée(s) : ${echecs.map((e) => e.nomFichier).join(", ")}.`);
    } catch (err) {
      toast.warning(`Créé, mais l'envoi des photos a échoué : ${err instanceof ApiError ? err.message : "erreur inconnue"}.`);
    }
  };
  return { attach, isPending: upload.isPending };
}

/** Médias publics d'une entité, la photo principale en premier. */
export function usePublicMediasQuery(entiteType: TypeEntiteMedia, entiteId: number) {
  return useQuery({
    queryKey: ["public-medias", entiteType, entiteId],
    queryFn: () => publicMediasApi.getByEntite(entiteType, entiteId),
    enabled: entiteId > 0,
    staleTime: 60 * 1000,
    select: (medias) => [...medias].sort((a, b) => Number(b.isPrincipal) - Number(a.isPrincipal) || a.ordre - b.ordre),
  });
}

/** Médias d'une entité côté agence (privés compris), la photo principale en premier. */
export function useAgenceMediasQuery(entiteType: TypeEntiteMedia, entiteId: number) {
  return useQuery({
    queryKey: ["agence-medias", entiteType, entiteId],
    queryFn: () => mediasApi.getByEntite(entiteType, entiteId),
    enabled: entiteId > 0,
    select: (medias) => [...medias].sort((a, b) => Number(b.isPrincipal) - Number(a.isPrincipal) || a.ordre - b.ordre),
  });
}

/** Galerie réelle d'une entité ; `isLoading` évite d'afficher les visuels génériques le temps du chargement. */
export function useMediaItems(entiteType: TypeEntiteMedia, entiteId: number) {
  const query = usePublicMediasQuery(entiteType, entiteId);
  return { items: toMediaItems(query.data ?? []), isLoading: query.isLoading };
}
