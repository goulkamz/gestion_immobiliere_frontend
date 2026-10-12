import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, LayoutDashboard, Building2, FileSignature, TrendingUp, FileText, Receipt } from "lucide-react";
import { useBailleurUiStore } from "@/store/bailleurUiStore";

const LINKS = [
  { to: "/espace-bailleur", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/espace-bailleur/patrimoine", label: "Mon patrimoine", icon: Building2 },
  { to: "/espace-bailleur/mandats", label: "Mes mandats", icon: FileSignature },
  { to: "/espace-bailleur/contrats", label: "Contrats de location", icon: FileText },
  { to: "/espace-bailleur/echeances", label: "Échéances locataires", icon: Receipt },
  { to: "/espace-bailleur/revenus", label: "Mes revenus", icon: TrendingUp },
];

/** Navigation verticale de l'espace bailleur, repliable pour libérer de l'espace au contenu. */
export function BailleurSidebar() {
  const collapsed = useBailleurUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useBailleurUiStore((s) => s.toggleSidebar);

  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      <div
        className={`hidden shrink-0 items-center rounded-xl bg-primary-50 lg:mb-2 lg:flex ${
          collapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "lg:justify-between lg:px-3 lg:py-2.5"
        }`}
      >
        {!collapsed && <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">Menu</span>}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          title={collapsed ? "Déplier le menu" : "Replier le menu"}
          className="flex items-center justify-center rounded-lg p-1 text-primary-600 transition-colors hover:bg-primary-100"
        >
          {collapsed ? <ChevronsRight size={17} aria-hidden="true" /> : <ChevronsLeft size={17} aria-hidden="true" />}
        </button>
      </div>

      <nav
        aria-label="Navigation de l'espace bailleur"
        className="flex gap-2 overflow-x-auto pb-2 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-1"
      >
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:justify-start ${
                collapsed ? "lg:justify-center lg:px-0" : ""
              } ${isActive ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
            }
          >
            <Icon size={17} aria-hidden="true" className="shrink-0" />
            <span className={collapsed ? "lg:sr-only" : ""}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
