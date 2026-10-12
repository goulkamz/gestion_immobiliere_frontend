import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlide {
  eyebrow: string;
  title: string;
  /** Portion du titre à colorer en or (doit être une sous-chaîne exacte de `title`). */
  highlight?: string;
  subtitle: string;
  imageUrl: string;
  /** Dégradé posé au-dessus de l'image (lisibilité + charte indigo/or), ex. "from-primary-950/90 via-primary-900/70 to-primary-800/40". */
  gradientClassName: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  children?: ReactNode;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const TITLE_SPEED_MS = 85;
const SUBTITLE_SPEED_MS = 38;
const HOLD_MS = 2600; // pause de lecture après un cycle complet, avant de retaper ou de passer à l'image suivante
const LOOPS = 2; // le texte se tape 2 fois avant de laisser la main à la diapositive suivante

/**
 * Titre + sous-titre révélés caractère par caractère (gauche → droite),
 * rejoués `LOOPS` fois avec une pause de lecture entre chaque passage,
 * puis `onCycleComplete` déclenche le changement de diapositive.
 */
function TypedHeroText({
  eyebrow,
  title,
  highlight,
  subtitle,
  onCycleComplete,
}: Pick<HeroSlide, "eyebrow" | "title" | "highlight" | "subtitle"> & { onCycleComplete: () => void }) {
  const reduced = prefersReducedMotion();
  const [titleCount, setTitleCount] = useState(() => (reduced ? title.length : 0));
  const [subtitleCount, setSubtitleCount] = useState(() => (reduced ? subtitle.length : 0));
  const onCycleCompleteRef = useRef(onCycleComplete);

  useEffect(() => {
    onCycleCompleteRef.current = onCycleComplete;
  });

  useEffect(() => {
    if (prefersReducedMotion()) {
      const timer = window.setTimeout(() => onCycleCompleteRef.current(), HOLD_MS * LOOPS);
      return () => window.clearTimeout(timer);
    }

    const timeouts: number[] = [];
    function schedule(fn: () => void, delay: number) {
      timeouts.push(window.setTimeout(fn, delay));
    }

    let t = 0;
    for (let loop = 0; loop < LOOPS; loop++) {
      schedule(() => {
        setTitleCount(0);
        setSubtitleCount(0);
      }, t);
      for (let i = 1; i <= title.length; i++) {
        schedule(() => setTitleCount(i), t + i * TITLE_SPEED_MS);
      }
      t += title.length * TITLE_SPEED_MS;
      for (let j = 1; j <= subtitle.length; j++) {
        schedule(() => setSubtitleCount(j), t + j * SUBTITLE_SPEED_MS);
      }
      t += subtitle.length * SUBTITLE_SPEED_MS;
      t += HOLD_MS;
    }
    schedule(() => onCycleCompleteRef.current(), t);

    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, [title, subtitle]);

  const typedTitle = title.slice(0, titleCount);
  const typedSubtitle = subtitle.slice(0, subtitleCount);
  const highlightStart = highlight ? title.indexOf(highlight) : -1;
  const highlightEnd = highlightStart >= 0 ? highlightStart + highlight!.length : -1;
  const titleDone = titleCount >= title.length;

  return (
    <>
      {/* Texte complet, immédiat, pour les lecteurs d'écran — l'animation ci-dessous est purement visuelle */}
      <span className="sr-only">
        {eyebrow}. {title}. {subtitle}
      </span>

      <div aria-hidden="true">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-300">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white md:text-5xl">
          {highlightStart >= 0 ? (
            <>
              {typedTitle.slice(0, Math.min(typedTitle.length, highlightStart))}
              <span className="text-accent-300">{typedTitle.slice(highlightStart, Math.min(typedTitle.length, highlightEnd))}</span>
              {typedTitle.slice(highlightEnd)}
            </>
          ) : (
            typedTitle
          )}
          {!titleDone && <span className="ml-0.5 inline-block h-[0.9em] w-0.5 animate-pulse bg-white align-middle" />}
        </h1>
        <p className="mt-4 text-white/90">
          {typedSubtitle}
          {titleDone && subtitleCount < subtitle.length && (
            <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-white align-middle" />
          )}
        </p>
      </div>
    </>
  );
}

/**
 * Carrousel plein écran : photos en fond, dégradé indigo/or superposé pour
 * la lisibilité, titre/sous-titre tapés caractère par caractère (2 passages
 * lisibles) avant de passer à la diapositive suivante, flèches manuelles et
 * indicateurs cliquables.
 */
export function HeroCarousel({ slides, children }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  }

  const slide = slides[index]!;

  return (
    <section
      className="relative isolate min-h-140 overflow-hidden sm:min-h-155 lg:min-h-170"
      aria-roledescription="carrousel"
      aria-label="Présentation"
    >
      {slides.map((s, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${s.imageUrl})` }}
        >
          <div className={`absolute inset-0 bg-linear-to-br ${s.gradientClassName}`} />
        </div>
      ))}

      {/* Nuages de dégradé décoratifs, communs à toutes les diapositives */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-104 w-104 rounded-full bg-primary-300/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-primary-300/10 blur-3xl" />
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Diapositive précédente"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:left-4 sm:p-2.5"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Diapositive suivante"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-4 sm:p-2.5"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div className="absolute inset-0 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16">
          <div
            key={index}
            className="w-full rounded-2xl bg-slate-950/25 p-6 text-center backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none"
          >
            <TypedHeroText
              key={slide.title}
              eyebrow={slide.eyebrow}
              title={slide.title}
              highlight={slide.highlight}
              subtitle={slide.subtitle}
              onCycleComplete={() => go(1)}
            />
          </div>

          <div className="mt-8 flex justify-center">{children}</div>

          {slides.length > 1 && (
            <div className="mt-10 flex justify-center gap-2" role="tablist" aria-label="Diapositives">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Diapositive ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-accent-400" : "w-2 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
