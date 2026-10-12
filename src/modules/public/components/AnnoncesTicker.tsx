import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import type { AnnonceResponse } from "@/api/types";

interface AnnoncesTickerProps {
  annonces: AnnonceResponse[];
}

/** Bandeau défilant des dernières annonces, sous le header. Masqué si aucune annonce. */
export function AnnoncesTicker({ annonces }: AnnoncesTickerProps) {
  if (annonces.length === 0) return null;

  // Répété suffisamment pour remplir l'écran même avec peu d'annonces (sinon le bloc
  // dupliqué est plus étroit que l'écran et semble réapparaître au milieu au lieu
  // de défiler en continu depuis la droite), puis dupliqué pour un bouclage sans coupure.
  const MIN_REPEATED_ITEMS = 8;
  const repeatCount = Math.max(1, Math.ceil(MIN_REPEATED_ITEMS / annonces.length));
  const repeated = Array.from({ length: repeatCount }, () => annonces).flat();
  const items = [...repeated, ...repeated];

  return (
    <div className="overflow-hidden border-b border-primary-100/70 bg-primary-50/70 py-2" aria-label="Dernières annonces">
      <div className="flex w-max animate-[marquee_35s_linear_infinite] gap-10 motion-reduce:animate-none">
        {items.map((annonce, index) => (
          <Link
            key={`${annonce.idAnnonce}-${index}`}
            to={`/annonces/${annonce.idAnnonce}`}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-primary-800 transition-colors hover:text-primary-600"
          >
            <Megaphone size={14} className="shrink-0 text-accent-500" aria-hidden="true" />
            {annonce.titre}
          </Link>
        ))}
      </div>
    </div>
  );
}
