import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  narrow?: boolean;
  /** Fond blanc uni (au lieu du gris standard), avec la photo de fond si fournie. */
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
        decorated ? "overflow-hidden bg-white" : "bg-slate-50"
      }`}
    >
      {decorated && backgroundImage && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 animate-[kenburns_22s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-white/60" />
        </div>
      )}
      <div className={`relative mx-auto w-full ${narrow ? "max-w-3xl" : "max-w-[1600px]"}`}>{children}</div>
    </main>
  );
}
