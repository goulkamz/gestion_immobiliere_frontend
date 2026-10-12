import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Building2, Calendar, CalendarCheck, DoorOpen, FileSignature, Package, Tags } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, LoadingSpinner, StatCard } from "@/components/ui";
import type { StatCardTone } from "@/components/ui";
import { useSessionStore } from "@/store/sessionStore";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useBiensServicesQuery } from "@/hooks/queries/usePublicCatalog";
import { useMaisonsGestionQuery } from "@/hooks/queries/useMaisons";
import { useCategoriesQuery } from "@/hooks/queries/useCategories";
import {
  useAgentDemandesEnAttenteQuery,
  useAgentEcheancesRetardQuery,
  useAgentMesMandatsQuery,
  useAgentReservationsEnAttenteQuery,
} from "@/hooks/queries/useStatsAgent";
import { statutLabel } from "@/utils/statut";

const dateHeaderFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const STATUT_CHART_COLORS: Record<string, string> = {
  DISPONIBLE: "var(--color-success-600)",
  LOUEE: "var(--color-primary-600)",
  RESERVEE: "var(--color-warning-600)",
  EN_MAINTENANCE: "var(--color-danger-600)",
};

const TONE_BORDER: Record<StatCardTone, string> = {
  primary: "border-t-primary-600",
  accent: "border-t-accent-500",
  success: "border-t-success-600",
  warning: "border-t-warning-600",
  danger: "border-t-danger-600",
};

const TONE_TEXT: Record<StatCardTone, string> = {
  primary: "text-primary-700",
  accent: "text-accent-600",
  success: "text-success-700",
  warning: "text-warning-700",
  danger: "text-danger-700",
};

function QuickStatCard({
  label,
  value,
  subtitle,
  icon,
  tone,
  to,
  linkLabel,
}: {
  label: string;
  value: ReactNode;
  subtitle?: string;
  icon: ReactNode;
  tone: StatCardTone;
  to: string;
  linkLabel: string;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border border-t-4 border-primary-100/60 bg-white p-4 shadow-sm ${TONE_BORDER[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className={`shrink-0 ${TONE_TEXT[tone]}`}>{icon}</span>
      </div>
      <p className="mt-1 font-heading text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
      <Link to={to} className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${TONE_TEXT[tone]} hover:underline`}>
        {linkLabel}
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function AgentDashboardPage() {
  const prenom = useSessionStore((s) => s.profile?.prenom);
  const coursQuery = useCoursQuery({ size: 1 });
  const maisonsQuery = useMaisonsGestionQuery({ size: 100 });
  const biensQuery = useBiensServicesQuery({ size: 1 });
  const categoriesQuery = useCategoriesQuery({ size: 1 });

  const demandesQuery = useAgentDemandesEnAttenteQuery();
  const reservationsQuery = useAgentReservationsEnAttenteQuery();
  const mandatsQuery = useAgentMesMandatsQuery();
  const echeancesRetardQuery = useAgentEcheancesRetardQuery();

  const isLoading = coursQuery.isLoading || maisonsQuery.isLoading || biensQuery.isLoading || categoriesQuery.isLoading;

  const repartitionMaisonsData = useMemo(() => {
    // Tous les statuts possibles sont affichés dans la légende, même à 0 (ex. "En maintenance"),
    // pour donner une vue complète des statuts existants et pas seulement de ceux déjà peuplés.
    const compte: Record<string, number> = Object.fromEntries(Object.keys(STATUT_CHART_COLORS).map((s) => [s, 0]));
    for (const m of maisonsQuery.data?.content ?? []) compte[m.statut] = (compte[m.statut] ?? 0) + 1;
    return Object.entries(compte).map(([statut, value]) => ({
      name: statutLabel(statut),
      value,
      color: STATUT_CHART_COLORS[statut] ?? "var(--color-primary-400)",
    }));
  }, [maisonsQuery.data]);

  const totalMandats = mandatsQuery.data ? Object.values(mandatsQuery.data).reduce((sum, n) => sum + n, 0) : 0;
  const detailMandats = mandatsQuery.data
    ? Object.entries(mandatsQuery.data)
        .map(([statut, n]) => `${n} ${statutLabel(statut).toLowerCase()}`)
        .join(", ")
    : undefined;

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-linear-to-br from-primary-700 to-primary-900 px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-200">{dateHeaderFormatter.format(new Date())}</p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-white">
          Bonjour, <span className="text-accent-400">{prenom ?? "vous"}</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-accent-400">Voici un aperçu du patrimoine et du catalogue gérés par l'agence.</p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Chargement du tableau de bord…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cours" value={coursQuery.data?.page.totalElements ?? 0} icon={<Building2 size={20} />} tone="primary" />
            <StatCard label="Maisons" value={maisonsQuery.data?.page.totalElements ?? 0} icon={<DoorOpen size={20} />} tone="accent" />
            <StatCard label="Biens & services" value={biensQuery.data?.page.totalElements ?? 0} icon={<Package size={20} />} tone="success" />
            <StatCard label="Catégories" value={categoriesQuery.data?.page.totalElements ?? 0} icon={<Tags size={20} />} tone="warning" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickStatCard
              label="Échéances en retard"
              value={echeancesRetardQuery.data?.length ?? 0}
              subtitle="Loyers et commissions impayés"
              icon={<AlertTriangle size={18} />}
              tone="danger"
              to="/espace-agent/echeances"
              linkLabel="Voir les échéances"
            />
            <QuickStatCard
              label="Réservations en attente"
              value={reservationsQuery.data?.length ?? 0}
              subtitle="Maisons à confirmer"
              icon={<CalendarCheck size={18} />}
              tone="warning"
              to="/espace-agent/reservations"
              linkLabel="Voir les réservations"
            />
            <QuickStatCard
              label="Locations en attente"
              value={demandesQuery.data?.length ?? 0}
              subtitle="Biens & services"
              icon={<Calendar size={18} />}
              tone="primary"
              to="/espace-agent/biens-services"
              linkLabel="Voir les biens & services"
            />
            <QuickStatCard
              label="Mes mandats"
              value={totalMandats}
              subtitle={detailMandats ?? "Aucun mandat confié"}
              icon={<FileSignature size={18} />}
              tone="success"
              to="/espace-agent/mandats"
              linkLabel="Voir les mandats"
            />
          </div>

          {repartitionMaisonsData.length > 0 && (
            <div className="mt-4">
              <Card>
                <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <ul className="space-y-2.5">
                    {repartitionMaisonsData.map((d) => (
                      <li key={d.name} className="flex items-center gap-2.5 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden="true" />
                        <span className="text-slate-600">{d.name}</span>
                        <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mx-auto h-64 w-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={repartitionMaisonsData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={3}>
                          {repartitionMaisonsData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-primary-100)", fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-semibold text-slate-900">Maisons par statut</h3>
                    <p className="mt-1 text-sm text-slate-500">Répartition du parc de maisons géré.</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
