import { useState } from "react";
import { PlayCircle } from "lucide-react";

export type MediaItem = { type: "image"; url: string } | { type: "video"; url: string; poster?: string };

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

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 sm:aspect-2/1">
        {!current ? (
          <div className="h-full w-full animate-pulse bg-slate-800" />
        ) : current.type === "video" ? (
          <video key={current.url} controls poster={current.poster} className="h-full w-full object-cover">
            <source src={current.url} />
          </video>
        ) : (
          <img src={current.url} alt={alt} className="h-full w-full object-cover" />
        )}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <button
              key={item.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={item.type === "video" ? `Vidéo ${i + 1} sur ${items.length}` : `Photo ${i + 1} sur ${items.length}`}
              aria-current={i === active}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-900 transition-colors sm:h-20 sm:w-28 ${
                i === active ? "border-primary-600" : "border-transparent hover:border-primary-300"
              }`}
            >
              {item.type === "image" && <img src={item.url} alt="" className="h-full w-full object-cover" />}
              {item.type === "video" && item.poster && <img src={item.poster} alt="" className="h-full w-full object-cover opacity-90" />}
              {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                  <PlayCircle size={22} className="text-white" aria-hidden="true" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
