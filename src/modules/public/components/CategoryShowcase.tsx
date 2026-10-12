import { Link } from "react-router-dom";
import { ArrowLink, Carousel, CarouselItem } from "@/components/ui";
import { usePublicMediasQuery } from "@/hooks/queries/useMedias";
import { getBienServiceImage, getCoverUrl } from "@/utils/media";
import type { BienServiceResponse } from "@/api/types";

/** Photo principale du bien/service ; visuel générique uniquement s'il n'a aucune photo. */
function BienThumb({ bien }: { bien: BienServiceResponse }) {
  const { data, isLoading } = usePublicMediasQuery("BIEN_SERVICE", bien.idBienService);
  const src = isLoading ? "" : ((data && getCoverUrl(data)) ?? getBienServiceImage(bien.idBienService, bien.libelleCategorie, bien.libelle));
  if (!src) return <div className="h-full w-full animate-pulse bg-slate-200" />;
  return <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />;
}

interface CategoryGroup {
  label: string;
  items: BienServiceResponse[];
}

interface CategoryShowcaseProps {
  groups: CategoryGroup[];
}

/**
 * Vitrine "Catégories populaires" : une colonne par catégorie (véhicules,
 * équipements, services…), pleine largeur, chaque colonne défile son
 * propre contenu ; un clic ouvre l'onglet Biens & services du catalogue.
 */
export function CategoryShowcase({ groups }: CategoryShowcaseProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.label} className="rounded-2xl border border-primary-100/60 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-slate-900">{group.label}</h3>
              <p className="text-sm text-slate-500">
                {group.items.length} bien{group.items.length > 1 ? "s" : ""} disponible{group.items.length > 1 ? "s" : ""}
              </p>
            </div>
            <ArrowLink to="/catalogue?tab=biens-services">Voir tout</ArrowLink>
          </div>
          <Carousel ariaLabel={`Catégorie ${group.label}`} autoplayMs={2800}>
            {group.items.map((bien) => (
              <CarouselItem key={bien.idBienService} widthClassName="w-[70%] sm:w-[55%]">
                <Link
                  to="/catalogue?tab=biens-services"
                  className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
                >
                  <BienThumb bien={bien} />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-transparent px-3 pb-2 pt-8">
                    <p className="truncate text-sm font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                      {bien.libelle}
                    </p>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      ))}
    </div>
  );
}
