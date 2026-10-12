import type { ComponentProps } from "react";
import { PropertyCard } from "@/components/ui";
import { usePublicMediasQuery } from "@/hooks/queries/useMedias";
import { getCoverUrl } from "@/utils/media";
import type { TypeEntiteMedia } from "@/api/types";

type MediaPropertyCardProps = Omit<ComponentProps<typeof PropertyCard>, "imageUrl" | "photoCount"> & {
  entiteType: TypeEntiteMedia;
  entiteId: number;
  /** Visuel générique, utilisé uniquement si l'entité n'a aucune photo. */
  fallbackImageUrl: string;
};

/** Carte dont l'image est la photo principale de l'entité ; le visuel générique ne sert que sans photo. */
export function MediaPropertyCard({ entiteType, entiteId, fallbackImageUrl, ...props }: MediaPropertyCardProps) {
  const { data, isLoading } = usePublicMediasQuery(entiteType, entiteId);
  const cover = data ? getCoverUrl(data) : undefined;
  const photoCount = data?.length ?? 0;
  return <PropertyCard {...props} imageUrl={isLoading ? "" : (cover ?? fallbackImageUrl)} photoCount={cover ? photoCount : undefined} />;
}
