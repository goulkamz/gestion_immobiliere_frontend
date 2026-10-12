import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  narrow?: boolean;
  /** Fond dégradé + nuages décoratifs, pour les pages formulaire (au lieu d'un simple fond gris uni). */
  decorated?: boolean;
  /** Photo illustrative en fond (zoom lent façon Ken Burns), atténuée sous le dégradé pour rester lisible. */
  backgroundImage?: string;
}

/** Conteneur de page standard : largeur max, marges responsives, fond commun. */
export function PageLayout({ children, narrow = false, decorated = false, backgroundImage }: PageLayoutProps) {
  return (
    <main
      id="main-content"
      className={`relative grow px-6 py-12 sm:px-10 lg:px-16 ${
        decorated ? "overflow-hidden bg-linear-to-b from-primary-50 via-white to-primary-50/60" : "bg-slate-50"
      }`}
    >
      {decorated && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 animate-[kenburns_22s_ease-in-out_infinite_alternate]"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-primary-100/75 via-white/55 to-primary-50/70" />
          <div className="absolute -top-20 -left-20 h-72 w-72 animate-[float_9s_ease-in-out_infinite] rounded-full bg-primary-300/35 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 animate-[float_11s_ease-in-out_infinite_1s] rounded-full bg-primary-400/25 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-56 w-56 animate-[float_13s_ease-in-out_infinite_0.5s] rounded-full bg-primary-200/30 blur-3xl" />
        </div>
      )}
      <div className={`relative mx-auto w-full ${narrow ? "max-w-3xl" : "max-w-[1600px]"}`}>{children}</div>
    </main>
  );
}
