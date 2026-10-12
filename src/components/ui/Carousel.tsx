import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  children: ReactNode;
  ariaLabel: string;
  /** Défilement automatique en millisecondes ; `0`/`undefined` désactive l'autoplay. */
  autoplayMs?: number;
}

/** Carrousel horizontal à défilement natif (scroll-snap), avec flèches manuelles toujours visibles et autoplay en boucle (pause au survol/tactile/clavier). */
export function Carousel({ children, ariaLabel, autoplayMs = 3500 }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  function scrollByStep(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = direction === 1 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    if (atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  }

  useEffect(() => {
    if (!autoplayMs || paused) return;
    const timer = window.setInterval(() => scrollByStep(1), autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, paused]);

  return (
    <div
      className="relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollByStep(-1)}
        aria-label="Précédent"
        className="absolute left-1 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-primary-100/70 bg-white/95 p-1.5 text-primary-700 shadow-md transition-colors hover:bg-primary-600 hover:text-white sm:p-2"
      >
        <ChevronLeft size={16} className="sm:hidden" />
        <ChevronLeft size={18} className="hidden sm:block" />
      </button>
      <button
        type="button"
        onClick={() => scrollByStep(1)}
        aria-label="Suivant"
        className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-primary-100/70 bg-white/95 p-1.5 text-primary-700 shadow-md transition-colors hover:bg-primary-600 hover:text-white sm:p-2"
      >
        <ChevronRight size={16} className="sm:hidden" />
        <ChevronRight size={18} className="hidden sm:block" />
      </button>
    </div>
  );
}

interface CarouselItemProps {
  children: ReactNode;
  widthClassName?: string;
}

export function CarouselItem({ children, widthClassName = "w-[78%] sm:w-[45%] lg:w-[31%]" }: CarouselItemProps) {
  return <div className={`shrink-0 snap-start ${widthClassName}`}>{children}</div>;
}
