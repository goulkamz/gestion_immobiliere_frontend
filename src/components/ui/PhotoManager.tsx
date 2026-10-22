import { useId, useRef } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { PHOTO_MAX_COUNT } from "./PhotoPicker";
import {
  useAddMediasMutation,
  useAgenceMediasQuery,
  useDeleteMediaMutation,
  useReorderMediasMutation,
  useSetPrincipalMediaMutation,
} from "@/hooks/queries/useMedias";
import { ApiError } from "@/api/http";
import type { TypeEntiteMedia } from "@/api/types";

interface PhotoManagerProps {
  entiteType: TypeEntiteMedia;
  entiteId: number;
  label?: string;
}

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_MO = 5;

/**
 * Gestion des photos d'une entité existante : ajout, suppression, choix de la photo principale et ordre
 * d'affichage (effet immédiat). La principale reste toujours en tête : on réordonne les autres photos.
 */
export function PhotoManager({ entiteType, entiteId, label = "Photos" }: PhotoManagerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: medias = [], isLoading } = useAgenceMediasQuery(entiteType, entiteId);
  const addMutation = useAddMediasMutation();
  const deleteMutation = useDeleteMediaMutation();
  const principalMutation = useSetPrincipalMediaMutation();
  const reorderMutation = useReorderMediasMutation();
  const busy = addMutation.isPending || deleteMutation.isPending || principalMutation.isPending || reorderMutation.isPending;

  function fail(err: unknown, fallback: string) {
    toast.error(err instanceof ApiError ? err.message : fallback);
  }

  /** Échange la photo `index` avec sa voisine (`sens` -1 = vers le début, +1 = vers la fin). */
  function deplacer(index: number, sens: -1 | 1) {
    const ids = medias.map((m) => m.idMedia);
    const cible = index + sens;
    [ids[index], ids[cible]] = [ids[cible]!, ids[index]!];
    reorderMutation.mutate(ids, { onError: (err) => fail(err, "Changement d'ordre impossible.") });
  }

  async function handleSelect(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (!PHOTO_TYPES.includes(f.type)) toast.error(`${f.name} : format non accepté (JPEG, PNG ou WebP).`);
      else if (f.size > PHOTO_MAX_MO * 1024 * 1024) toast.error(`${f.name} : dépasse ${PHOTO_MAX_MO} Mo.`);
      else accepted.push(f);
    }
    if (inputRef.current) inputRef.current.value = "";
    const places = Math.max(PHOTO_MAX_COUNT - medias.length, 0);
    if (accepted.length > places) toast.error(`Maximum ${PHOTO_MAX_COUNT} photos : seules ${places} peuvent encore être ajoutées.`);
    const fichiers = accepted.slice(0, places);
    if (fichiers.length === 0) return;
    try {
      const { echecs } = await addMutation.mutateAsync({ entiteType, entiteId, fichiers, principal: medias.length === 0 });
      if (echecs.length > 0) toast.warning(`${echecs.length} photo(s) non envoyée(s) : ${echecs.map((e) => e.nomFichier).join(", ")}.`);
    } catch (err) {
      fail(err, "Envoi des photos impossible.");
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input ref={inputRef} type="file" accept={PHOTO_TYPES.join(",")} multiple className="sr-only" id={inputId} onChange={(e) => handleSelect(e.target.files)} />
      <div className="flex flex-wrap gap-2">
        {medias.map((m, i) => (
          <div key={m.idMedia} className="relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200">
            <img src={m.urlThumbnail ?? m.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {m.isPrincipal && <span className="absolute inset-x-0 bottom-0 bg-primary-700/80 text-center text-[10px] font-medium text-white">Principale</span>}
            {/* Position 0 = principale, fixe ; la 1re des autres ne peut pas passer devant elle */}
            {!m.isPrincipal && i > 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => deplacer(i, -1)}
                aria-label={`Déplacer la photo ${i + 1} vers le début`}
                className="absolute bottom-0.5 left-0.5 rounded-full bg-slate-900/60 p-0.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <ChevronLeft size={12} />
              </button>
            )}
            {!m.isPrincipal && i < medias.length - 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => deplacer(i, 1)}
                aria-label={`Déplacer la photo ${i + 1} vers la fin`}
                className="absolute bottom-0.5 right-0.5 rounded-full bg-slate-900/60 p-0.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <ChevronRight size={12} />
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => deleteMutation.mutate(m.idMedia, { onError: (err) => fail(err, "Suppression impossible.") })}
              aria-label={`Supprimer la photo ${i + 1}`}
              className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/60 p-0.5 text-white hover:bg-danger-600 disabled:opacity-50"
            >
              <Trash2 size={12} />
            </button>
            {!m.isPrincipal && (
              <button
                type="button"
                disabled={busy}
                onClick={() => principalMutation.mutate(m.idMedia, { onError: (err) => fail(err, "Changement impossible.") })}
                aria-label={`Définir la photo ${i + 1} comme principale`}
                className="absolute left-0.5 top-0.5 rounded-full bg-slate-900/60 p-0.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <Star size={12} />
              </button>
            )}
          </div>
        ))}
        {!isLoading && medias.length < PHOTO_MAX_COUNT && (
          <label
            htmlFor={inputId}
            className={`flex h-16 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-primary-300 text-xs text-primary-600 hover:bg-primary-50 ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            <ImagePlus size={18} aria-hidden="true" />
            {addMutation.isPending ? "Envoi…" : "Ajouter"}
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">Les changements sont appliqués immédiatement. {PHOTO_MAX_COUNT} photos maximum.</p>
    </div>
  );
}
