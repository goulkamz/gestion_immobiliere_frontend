import { useEffect, useRef, useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { GoulkamLogo } from "@/components/ui";
import { DEVELOPER } from "@/config/developer";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Signature discrète "Conçu et développé par GOULKAM CONSULTING" avec panneau de contact au clic. */
export function DeveloperCredit() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? panel)?.focus();

    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Voir les coordonnées du développeur, ${DEVELOPER.nom}`}
        className="inline-flex items-center gap-1.5 text-[11px] text-white/70 transition-colors hover:text-accent-300"
      >
        <span>Conçu et développé par</span>
        <GoulkamLogo width={72} height={13} />
        <span className="font-medium">{DEVELOPER.nom}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={`Coordonnées de ${DEVELOPER.nom}`}
          tabIndex={-1}
          className="absolute bottom-full left-1/2 z-20 mb-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-[fade-up_0.15s_ease-out] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl shadow-slate-900/20 sm:left-auto sm:right-0 sm:translate-x-0"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <GoulkamLogo width={96} height={18} contourColor="#94a3b8" />
              <p className="mt-2 text-sm font-semibold text-slate-900">{DEVELOPER.nom}</p>
              <p className="text-xs text-slate-500">{DEVELOPER.tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <a
              href={`mailto:${DEVELOPER.email}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <Mail size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
              {DEVELOPER.email}
            </a>
            {DEVELOPER.telephones.map((tel) => (
              <a
                key={tel.href}
                href={tel.href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <Phone size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
                {tel.label}
              </a>
            ))}
          </div>

          {(DEVELOPER.facebookUrl || DEVELOPER.tiktokUrl) && (
            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
              {DEVELOPER.facebookUrl && (
                <a
                  href={DEVELOPER.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Facebook de ${DEVELOPER.nom}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-primary-100 hover:text-primary-700"
                >
                  <FacebookIcon />
                </a>
              )}
              {DEVELOPER.tiktokUrl && (
                <a
                  href={DEVELOPER.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`TikTok de ${DEVELOPER.nom}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-primary-100 hover:text-primary-700"
                >
                  <TiktokIcon />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.3-1.6 1.6-1.6h1.7V3.1C16.5 3 15.5 3 14.4 3c-2.4 0-4 1.4-4 4.1v2.7H7.7V13H10.4v8h3.1Z" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.4 1.9 1.7 3.3 3.5 3.7v2.6c-1.3 0-2.5-.4-3.5-1.1v6.4c0 3-2.5 5.4-5.5 5.4S5.5 17.6 5.5 14.6c0-2.9 2.3-5.2 5.2-5.4v2.7c-1.4.2-2.5 1.4-2.5 2.7 0 1.5 1.3 2.8 2.8 2.8s2.8-1.3 2.8-2.8V3h2.7Z" />
    </svg>
  );
}
