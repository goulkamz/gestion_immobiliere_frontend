import { ImageOff } from "lucide-react";
import { MediaGallery } from "./MediaGallery";
import { useMediaItems } from "@/hooks/queries/useMedias";
import type { TypeEntiteMedia } from "@/api/types";

interface EntityPhotoPreviewProps {
  entiteType: TypeEntiteMedia;
  /** 0 ou undefined tant que rien n'est choisi dans la liste : rien n'est affiché. */
  entiteId?: number;
  alt: string;
}

/** Aperçu des photos du bien choisi dans une liste déroulante, sous le champ de sélection. */
export function EntityPhotoPreview({ entiteType, entiteId, alt }: EntityPhotoPreviewProps) {
  const id = entiteId && entiteId > 0 ? entiteId : 0;
  const { items, isLoading } = useMediaItems(entiteType, id);
  if (id === 0) return null;
  if (isLoading) return <div className="aspect-video w-full animate-pulse rounded-xl bg-slate-200" />;
  if (items.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm text-slate-500">
        <ImageOff size={28} aria-hidden="true" />
        Aucune photo pour le moment
      </div>
    );
  }
  return <MediaGallery items={items} alt={alt} />;
}
