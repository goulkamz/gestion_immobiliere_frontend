import { NavLink } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Building2,
  DoorOpen,
  Tags,
  Package,
  FileSignature,
  CalendarCheck,
  FileText,
  Megaphone,
  Mail,
  ClipboardList,
  HandCoins,
  Receipt,
  Banknote,
  MessageSquareQuote,
  Users,
  KeyRound,
} from "lucide-react";
import { useAgentUiStore } from "@/store/agentUiStore";

const LINKS = [
  { to: "/espace-agent", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/espace-agent/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/espace-agent/cours", label: "Cours", icon: Building2 },
  { to: "/espace-agent/maisons", label: "Maisons", icon: DoorOpen },
  { to: "/espace-agent/categories", label: "Catégories", icon: Tags },
  { to: "/espace-agent/biens-services", label: "Biens & services", icon: Package },
  { to: "/espace-agent/mandats", label: "Mandats", icon: FileSignature },
  { to: "/espace-agent/reservations", label: "Réservations", icon: CalendarCheck },
  { to: "/espace-agent/locations-biens-services", label: "Locations biens & services", icon: KeyRound },
  { to: "/espace-agent/contrats-location", label: "Contrats de location", icon: FileText },
  { to: "/espace-agent/annonces", label: "Annonces", icon: Megaphone },
  { to: "/espace-agent/contacts", label: "Contacts", icon: Mail },
  { to: "/espace-agent/demandes", label: "Demandes", icon: ClipboardList },
  { to: "/espace-agent/offres", label: "Offres", icon: HandCoins },
  { to: "/espace-agent/echeances", label: "Échéances", icon: Receipt },
  { to: "/espace-agent/reversements", label: "Reversements bailleurs", icon: Banknote },
  { to: "/espace-agent/temoignages", label: "Témoignages", icon: MessageSquareQuote },
];

/** Navigation verticale de l'espace agent, repliable pour libérer de l'espace au contenu. */
export function AgentSidebar() {
  const collapsed = useAgentUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAgentUiStore((s) => s.toggleSidebar);

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

      {/* max-h + overflow-y-auto : le menu défile sur lui-même au lieu d'allonger toute la page
          quand il contient beaucoup de liens (cf. espace agent). */}
      <nav
        aria-label="Navigation de l'espace agent"
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
