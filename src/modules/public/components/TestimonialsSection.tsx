import { Link } from "react-router-dom";
import { Quote, Star } from "lucide-react";
import { Carousel, CarouselItem, LoadingSpinner } from "@/components/ui";
import { useTemoignagesQuery } from "@/hooks/queries/useTemoignages";
import { temoignageRoleLabel, initialsFromFullName } from "@/utils/temoignage";
import { formatDate } from "@/utils/format";
import { logger } from "@/utils/logger";
import type { Temoignage } from "@/api/types";

/**
 * Section "Ils nous font confiance". Ne casse jamais la page : une erreur
 * de chargement ou une liste vide font simplement disparaître la section
 * (pas de message d'erreur intrusif sur une section non critique).
 */
export function TestimonialsSection() {
  const temoignagesQuery = useTemoignagesQuery();

  if (temoignagesQuery.isError) {
    logger.warn("Impossible de charger les témoignages, section masquée.", temoignagesQuery.error);
    return null;
  }

  if (temoignagesQuery.isLoading) {
    return (
      <section className="mt-16" aria-labelledby="temoignages-title">
        <h2 id="temoignages-title" className="mb-4 text-center font-heading text-xl font-bold text-slate-900">
          Ils nous font confiance
        </h2>
        <LoadingSpinner text="Chargement des témoignages…" />
      </section>
    );
  }

  const temoignages = temoignagesQuery.data ?? [];
  if (temoignages.length === 0) return null;

  return (
    <section
      className="relative mt-16 overflow-hidden rounded-2xl bg-linear-to-b from-primary-50 via-white to-primary-50/60 px-4 py-12 sm:px-8"
      aria-labelledby="temoignages-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl" />
      </div>

      <div className="relative mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Témoignages</p>
        <h2 id="temoignages-title" className="mt-2 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          Ils nous font confiance
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Ce que propriétaires, locataires et partenaires disent de leur expérience avec GestImmo.
        </p>
      </div>

      <div className="relative">
        <Carousel ariaLabel="Témoignages">
          {temoignages.map((temoignage) => (
            <CarouselItem key={temoignage.idTemoignage} widthClassName="w-[85%] sm:w-[62%] lg:w-[38%]">
              <TestimonialCard temoignage={temoignage} />
            </CarouselItem>
          ))}
        </Carousel>
      </div>

      <p className="relative mt-8 text-center text-sm text-slate-500">
        Une expérience à partager ?{" "}
        <Link to="/laisser-un-avis" className="font-semibold text-primary-700 hover:underline">
          Laisser un avis
        </Link>
      </p>
    </section>
  );
}

function TestimonialCard({ temoignage }: { temoignage: Temoignage }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border-t-4 border-primary-600 bg-white p-6 shadow-lg shadow-slate-900/5">
      <Quote
        className="pointer-events-none absolute -right-3 -top-4 text-primary-50"
        size={96}
        strokeWidth={1.5}
        aria-hidden="true"
      />

      {temoignage.note !== undefined && (
        <div className="relative flex items-center gap-0.5" role="img" aria-label={`Note : ${temoignage.note} sur 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={15}
              className={i < temoignage.note! ? "fill-accent-400 text-accent-400" : "text-slate-200"}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      <p className="relative mt-4 line-clamp-5 flex-1 font-heading text-base italic leading-relaxed text-slate-700">
        <span className="mr-0.5 text-2xl leading-none text-primary-300">"</span>
        {temoignage.texte}
        <span className="ml-0.5 text-2xl leading-none text-primary-300">"</span>
      </p>

      <div className="relative mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        {temoignage.photoUrl ? (
          <img
            src={temoignage.photoUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary-100"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-600 to-indigo-600 text-sm font-semibold text-white ring-2 ring-primary-100">
            {initialsFromFullName(temoignage.nomAuteur)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{temoignage.nomAuteur}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
              {temoignageRoleLabel(temoignage.role)}
            </span>
            <span className="text-xs text-slate-400">{formatDate(temoignage.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
