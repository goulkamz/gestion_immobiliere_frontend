import { Link } from "react-router-dom";
import { Eye, CalendarCheck, Images, MessageCircle } from "lucide-react";
import { Badge } from "./Badge";
import type { BadgeVariant } from "./Badge";
import { Button } from "./Button";

interface PropertyCardProps {
  /** Vide pendant le chargement de la photo. */
  imageUrl: string;
  /** Nombre de photos disponibles pour ce bien ; affiche un badge compteur sur l'image si fourni. */
  photoCount?: number;
  title: string;
  description: string;
  priceLabel: string;
  statut?: string;
  statutVariant?: BadgeVariant;
  detailHref: string;
  onReserve: () => void;
  /** "reserver" (par défaut) pour un bien/maison réservable, "contacter" pour une annonce sans entité associée. */
  actionKind?: "reserver" | "contacter";
}

/** Carte bien/maison : image en fond, titre + description au bas de l'image, actions "Voir détail" / "Réserver" (ou "Contacter"). */
export function PropertyCard({
  imageUrl,
  photoCount,
  title,
  description,
  priceLabel,
  statut,
  statutVariant = "neutral",
  detailHref,
  onReserve,
  actionKind = "reserver",
}: PropertyCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-primary-100/60 bg-white shadow-sm transition-all hover:border-primary-200 hover:shadow-md hover:shadow-primary-900/10">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full animate-pulse bg-slate-200" />}
        {statut && (
          <div className="absolute right-2 top-2">
            <Badge variant={statutVariant}>{statut}</Badge>
          </div>
        )}
        {!!photoCount && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-slate-950/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Images size={12} aria-hidden="true" />
            {photoCount}
          </div>
        )}
        {/* Voile de bas d'image (dégradé opaque) : garantit la lisibilité du titre même si le texte et l'image partagent la même teinte */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/95 via-slate-950/60 to-transparent px-4 pb-3 pt-12">
          <h3 className="font-heading text-base font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">{title}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/90">{description}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-semibold text-primary-700">{priceLabel}</p>
        <div className="mt-auto flex gap-2">
          <Link to={detailHref} className="flex-1">
            <Button variant="outline" size="sm" fullWidth icon={<Eye size={14} />}>
              Détail
            </Button>
          </Link>
          <Button
            variant="accent"
            size="sm"
            className="flex-1"
            icon={actionKind === "contacter" ? <MessageCircle size={14} /> : <CalendarCheck size={14} />}
            onClick={onReserve}
          >
            {actionKind === "contacter" ? "Contacter" : "Réserver"}
          </Button>
        </div>
      </div>
    </div>
  );
}
