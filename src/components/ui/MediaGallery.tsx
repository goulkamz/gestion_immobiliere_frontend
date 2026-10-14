import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";

export type MediaItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string; poster?: string };

interface MediaGalleryProps {
  items: MediaItem[];
  alt: string;
}

/**
 * Grande vignette (photo ou vidéo) + bande de miniatures cliquables.
 * Chaque bien/maison peut avoir plusieurs médias, mélangeant photos et vidéos.
 */
export function MediaGallery({ items, alt }: MediaGalleryProps) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Met à jour les flèches au redimensionnement et quand la liste de médias change.
  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [items.length, updateArrows]);

  // Garde la miniature active entièrement visible (jamais à moitié coupée).
  useEffect(() => {
    const el = stripRef.current;
    const thumb = el?.children[active] as HTMLElement | undefined;
    if (!el || !thumb) return;
    if (thumb.offsetLeft < el.scrollLeft)
      el.scrollTo({ left: thumb.offsetLeft, behavior: "smooth" });
    else if (
      thumb.offsetLeft + thumb.offsetWidth >
      el.scrollLeft + el.clientWidth
    )
      el.scrollTo({
        left: thumb.offsetLeft + thumb.offsetWidth - el.clientWidth,
        behavior: "smooth",
      });
  }, [active]);

  function scrollStrip(direction: 1 | -1) {
    const el = stripRef.current;
    if (el)
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        behavior: "smooth",
      });
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 sm:aspect-2/1">
        {!current ? (
          <div className="h-full w-full animate-pulse bg-slate-800" />
        ) : current.type === "video" ? (
          <video
            key={current.url}
            controls
            poster={current.poster}
            className="h-full w-full object-cover"
          >
            <source src={current.url} />
          </video>
        ) : (
          <img
            src={current.url}
            alt={alt}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {items.length > 1 && (
        <div className="relative mt-3">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              aria-label="Miniatures précédentes"
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 text-slate-700 shadow hover:bg-white"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              aria-label="Miniatures suivantes"
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 text-slate-700 shadow hover:bg-white"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
          <div
            ref={stripRef}
            onScroll={updateArrows}
            className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
          >
            {items.map((item, i) => (
              <button
                key={item.url + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={
                  item.type === "video"
                    ? `Vidéo ${i + 1} sur ${items.length}`
                    : `Photo ${i + 1} sur ${items.length}`
                }
                aria-current={i === active}
                className={`relative h-16 w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 bg-slate-900 transition-colors sm:h-20 sm:w-28 ${
                  i === active
                    ? "border-primary-600"
                    : "border-transparent hover:border-primary-300"
                }`}
              >
                {item.type === "image" && (
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {item.type === "video" && item.poster && (
                  <img
                    src={item.poster}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                )}
                {item.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                    <PlayCircle
                      size={22}
                      className="text-white"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
