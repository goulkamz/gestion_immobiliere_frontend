import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ArrowLink, GradientBlobs } from "@/components/ui";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";
import type { Domaine } from "../data/domaines";

interface DomaineCardProps {
  domaine: Domaine;
  /** Carte phare : plus grande, image et texte côte à côte sur desktop. */
  phare?: boolean;
  /** Retarde légèrement l'apparition pour un effet de cascade dans la grille. */
  delayMs?: number;
}

function DomaineImage({ domaine, className }: { domaine: Domaine; className: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = domaine.icon;

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`Illustration du domaine ${domaine.titre}`}
        className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br from-primary-700 via-primary-500 to-primary-300 ${className}`}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden="true"
        />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-primary-900/20 blur-2xl" aria-hidden="true" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
          <Icon size={36} className="text-white" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <img
      src={`/images/domaines/${domaine.image}`}
      alt={`Illustration du domaine ${domaine.titre}`}
      width={800}
      height={600}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function DomaineCard({ domaine, phare = false, delayMs = 0 }: DomaineCardProps) {
  const [ref, inView] = useInViewAnimation<HTMLDivElement>();
  const Icon = domaine.icon;

  const transitionClass =
    "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none";
  const revealClass = inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6";
  const style = inView && delayMs ? { transitionDelay: `${delayMs}ms` } : undefined;

  if (phare) {
    return (
      <div
        ref={ref}
        style={style}
        className={`group grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-xl md:grid-cols-2 ${transitionClass} ${revealClass}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-104">
          <DomaineImage
            domaine={domaine}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
          />
        </div>
        <div className="relative flex flex-col justify-center overflow-hidden bg-linear-to-br from-primary-700 via-primary-800 to-primary-950 p-6 text-white sm:p-8">
          <GradientBlobs />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-accent-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-950">
            <Icon size={14} aria-hidden="true" />
            Domaine phare
          </span>
          <h3 className="relative mt-3 font-heading text-2xl font-bold text-white">{domaine.titre}</h3>
          <p className="relative mt-2 text-primary-100">{domaine.accroche}</p>
          <ul className="relative mt-4 space-y-2">
            {domaine.pointsForts.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-primary-50">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent-300" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
          <ArrowLink to={domaine.cta.to} className="relative mt-6 w-fit">
            {domaine.cta.label}
          </ArrowLink>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={style}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary-100/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/10 hover:ring-primary-200 motion-reduce:hover:translate-y-0 ${transitionClass} ${revealClass}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <DomaineImage
          domaine={domaine}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-slate-950/25 via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>
      <div className="relative -mt-6 pl-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-md ring-1 ring-slate-100 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-3">
        <h3 className="font-heading text-lg font-bold text-accent-700 transition-colors duration-300 group-hover:text-accent-800">
          {domaine.titre}
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">{domaine.accroche}</p>
        <ul className="mt-3.5 flex flex-wrap gap-1.5">
          {domaine.pointsForts.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 py-1 pl-1.5 pr-2.5 text-xs font-medium text-slate-700"
            >
              <CheckCircle2 size={13} className="shrink-0 text-accent-500" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <ArrowLink to={domaine.cta.to} className="mt-4 w-fit">
          {domaine.cta.label}
        </ArrowLink>
      </div>
    </div>
  );
}
