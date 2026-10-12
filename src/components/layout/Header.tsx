import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Home, LogOut, Megaphone, Menu, X } from "lucide-react";
import { useSessionStore, selectIsAuthenticated, selectRole } from "@/store/sessionStore";
import { useLogoutMutation } from "@/hooks/queries/useAuth";
import { Button } from "@/components/ui";
import type { Role } from "@/api/types";

const ROLE_SPACE_LINK: Record<Role, { to: string; label: string }> = {
  ROLE_CLIENT: { to: "/espace-client", label: "Mon espace" },
  ROLE_BAILLEUR: { to: "/espace-bailleur", label: "Mon espace" },
  ROLE_AGENT: { to: "/espace-agent", label: "Mon espace" },
  ROLE_ADMIN: { to: "/espace-admin", label: "Administration" },
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors ${
    isActive ? "text-primary-700 after:bg-primary-600" : "text-slate-600 hover:text-slate-900 after:bg-transparent hover:after:bg-slate-200"
  }`;

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function initials(prenom?: string, nom?: string): string {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const role = useSessionStore(selectRole);
  const profile = useSessionStore((s) => s.profile);
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();
  const scrolled = useScrolled();

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    navigate("/");
  }

  const spaceLink = role ? ROLE_SPACE_LINK[role] : null;

  return (
    <header
      className={`sticky top-0 z-30 bg-white/90 backdrop-blur-md transition-shadow ${
        scrolled ? "shadow-sm shadow-primary-900/10" : ""
      }`}
    >
      <a href="#main-content" className="sr-only-focusable">
        Aller au contenu principal
      </a>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5">
        <Link to="/" className="group flex items-center gap-2 font-heading text-lg font-bold text-primary-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-primary-600 to-indigo-700 text-white shadow-sm transition-transform group-hover:scale-105">
            <Building2 size={20} aria-hidden="true" />
          </span>
          GestImmo
        </Link>

        <nav id="main-navigation" aria-label="Navigation principale" className="hidden items-center gap-1 xl:flex">
          <NavLink to="/" end className={navLinkClass}>
            Accueil
          </NavLink>
          <CatalogueDropdown />
          <Link
            to="/catalogue?tab=biens-services"
            className="relative whitespace-nowrap px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors hover:text-slate-900 hover:after:bg-slate-200"
          >
            Biens & services
          </Link>
          <NavLink to="/deposer-une-demande" className={navLinkClass}>
            Déposer une demande
          </NavLink>
          <NavLink to="/proposer-un-bien" className={navLinkClass}>
            Proposer un bien
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
          {spaceLink && (
            <NavLink to={spaceLink.to} className={navLinkClass}>
              {spaceLink.label}
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profil"
                className="flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-primary-600 to-indigo-600 text-[11px] font-semibold text-white">
                  {initials(profile?.prenom, profile?.nom)}
                </span>
                {profile?.prenom ?? "Profil"}
              </Link>
              <Button variant="ghost" size="sm" icon={<LogOut size={16} />} onClick={handleLogout} loading={logoutMutation.isPending}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">
                Connexion
              </Link>
              <Button variant="accent" size="sm" className="shadow-sm shadow-accent-600/20 hover:shadow-md hover:shadow-accent-600/30" onClick={() => navigate("/inscription")}>
                Créer un compte
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 xl:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Navigation mobile"
          className="animate-[fade-up_0.2s_ease-out] border-t border-primary-100/70 bg-white px-4 pb-4 xl:hidden"
        >
          <ul className="flex flex-col gap-1 pt-2">
            {[
              { to: "/", label: "Accueil" },
              { to: "/catalogue", label: "Catalogue" },
              { to: "/annonces", label: "Annonces" },
              { to: "/catalogue?tab=biens-services", label: "Biens & services" },
              { to: "/deposer-une-demande", label: "Déposer une demande" },
              { to: "/proposer-un-bien", label: "Proposer un bien" },
              { to: "/contact", label: "Contact" },
              ...(spaceLink ? [spaceLink] : []),
            ].map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 border-t border-primary-100/70 pt-3">
              {isAuthenticated ? (
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary-600 to-indigo-600 text-xs font-semibold text-white">
                      {initials(profile?.prenom, profile?.nom)}
                    </span>
                    {profile?.prenom ?? "Profil"}
                  </span>
                  <Button variant="ghost" size="sm" icon={<LogOut size={16} />} onClick={handleLogout}>
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-1">
                  <Link
                    to="/connexion"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Connexion
                  </Link>
                  <Button variant="accent" size="sm" onClick={() => { setMobileOpen(false); navigate("/inscription"); }}>
                    Créer un compte
                  </Button>
                </div>
              )}
            </li>
          </ul>
        </nav>
      )}
      <div className="h-0.5 bg-linear-to-r from-primary-600 via-primary-400 to-primary-600" aria-hidden="true" />
    </header>
  );
}

/** Regroupe Catalogue (maisons & biens) et Annonces sous un seul onglet, comme demandé par la spec (6 onglets). */
function CatalogueDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`relative inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors ${
          open ? "text-primary-700 after:bg-primary-600" : "text-slate-600 hover:text-slate-900 after:bg-transparent hover:after:bg-slate-200"
        }`}
      >
        Catalogue / Annonces
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] w-52 origin-top animate-[fade-up_0.15s_ease-out] overflow-hidden rounded-xl border border-primary-100/70 bg-white py-1.5 shadow-lg shadow-primary-900/10"
        >
          <Link
            role="menuitem"
            to="/catalogue"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
          >
            <Home size={16} className="text-slate-400" aria-hidden="true" />
            Maisons
          </Link>
          <Link
            role="menuitem"
            to="/annonces"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
          >
            <Megaphone size={16} className="text-slate-400" aria-hidden="true" />
            Annonces
          </Link>
        </div>
      )}
    </div>
  );
}
