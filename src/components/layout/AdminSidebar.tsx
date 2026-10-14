import { NavLink } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Users,
  MessageSquareQuote,
  MapPin,
  SlidersHorizontal,
  ScrollText,
  FileBarChart,
} from "lucide-react";
import { useAgentUiStore } from "@/store/agentUiStore";

const LINKS = [
  { to: "/espace-admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/espace-admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/espace-admin/temoignages", label: "Témoignages", icon: MessageSquareQuote },
  { to: "/espace-admin/localisation", label: "Localisation", icon: MapPin },
  { to: "/espace-admin/parametres", label: "Paramètres", icon: SlidersHorizontal },
  { to: "/espace-admin/journal", label: "Journal d'audit", icon: ScrollText },
  { to: "/espace-admin/rapports", label: "Rapports mensuels", icon: FileBarChart },
];

/** Navigation verticale de l'espace admin (repli partagé avec l'espace agent). */
export function AdminSidebar() {
  const collapsed = useAgentUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAgentUiStore((s) => s.toggleSidebar);

  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      <div
        className={`hidden shrink-0 items-center rounded-xl bg-primary-50 lg:mb-2 lg:flex ${
          collapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "lg:justify-between lg:px-3 lg:py-2.5"
        }`}
      >
        {!collapsed && <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">Administration</span>}
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
        aria-label="Navigation de l'espace admin"
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
