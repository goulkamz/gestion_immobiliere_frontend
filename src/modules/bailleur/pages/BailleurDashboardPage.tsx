import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Building2, FileCheck2, Home, PiggyBank, Percent, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, StatCard, LoadingSpinner } from "@/components/ui";
import { useSessionStore } from "@/store/sessionStore";
import { useBailleurDepensesStatsQuery, useBailleurPatrimoineQuery, useBailleurRevenusQuery } from "@/hooks/queries/useStatsBailleur";
import { formatMontant, formatMonth } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import { montantCompact } from "@/modules/admin/dashboard/helpers";

const dateHeaderFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const STATUT_CHART_COLORS: Record<string, string> = {
  DISPONIBLE: "var(--color-success-600)",
  LOUEE: "var(--color-primary-600)",
  RESERVEE: "var(--color-warning-600)",
  EN_MAINTENANCE: "var(--color-danger-600)",
};

export function BailleurDashboardPage() {
  const prenom = useSessionStore((s) => s.profile?.prenom);
  const patrimoineQuery = useBailleurPatrimoineQuery();
  const revenusQuery = useBailleurRevenusQuery();
  // Secondaire : le tableau de bord s'affiche même si ce bloc échoue
  const depenses = useBailleurDepensesStatsQuery().data;
  const aDesDepenses = depenses !== undefined && (depenses.nombreEnCours > 0 || depenses.nombreDues > 0 || depenses.devisEnAttente > 0);

  const isLoading = patrimoineQuery.isLoading || revenusQuery.isLoading;

  const totalRecu = revenusQuery.data?.reduce((sum, r) => sum + (r.montantRecu ?? 0), 0) ?? 0;
  const tauxOccupation = patrimoineQuery.data?.tauxOccupation;

  const revenusChartData = useMemo(() => {
    const list = [...(revenusQuery.data ?? [])].sort((a, b) => a.periodeMois.localeCompare(b.periodeMois));
    return list.slice(-6).map((r) => ({
      periode: formatMonth(r.periodeMois),
      "Dû": r.montantDu ?? 0,
      "Reçu": r.montantRecu ?? 0,
    }));
  }, [revenusQuery.data]);

  const repartitionChartData = useMemo(() => {
    const parStatut = patrimoineQuery.data?.maisonsParStatut ?? {};
    return Object.entries(parStatut).map(([statut, value]) => ({
      name: statutLabel(statut),
      value,
      color: STATUT_CHART_COLORS[statut] ?? "var(--color-primary-400)",
    }));
  }, [patrimoineQuery.data]);

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-linear-to-br from-primary-700 to-primary-900 px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-200">{dateHeaderFormatter.format(new Date())}</p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-white">
          Bonjour, <span className="text-accent-400">{prenom ?? "vous"}</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-accent-400">Voici un aperçu de votre patrimoine et de vos revenus locatifs.</p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Chargement de votre tableau de bord…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cours" value={patrimoineQuery.data?.nbCours ?? 0} icon={<Building2 size={20} />} tone="primary" />
            <StatCard label="Maisons" value={patrimoineQuery.data?.nbMaisons ?? 0} icon={<Home size={20} />} tone="accent" />
            <StatCard
              label="Taux d'occupation"
              value={tauxOccupation !== null && tauxOccupation !== undefined ? `${Math.round(tauxOccupation)} %` : "-"}
              icon={<Percent size={20} />}
              tone="success"
            />
            <StatCard label="Total reçu" value={formatMontant(totalRecu)} icon={<PiggyBank size={20} />} tone="warning" />
          </div>

          {aDesDepenses && depenses && (
            <Card title="Travaux et dépenses" subtitle="Dépenses avancées par l'agence sur vos cours et devis soumis à votre accord" className="mt-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <Link to="/espace-bailleur/depenses" className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 transition-colors hover:bg-primary-50">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Wrench size={14} aria-hidden="true" /> Reste à retenir
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">{formatMontant(depenses.resteARetenir)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {depenses.nombreEnCours > 0
                      ? `${depenses.nombreEnCours} dépense${depenses.nombreEnCours > 1 ? "s" : ""} retenue${depenses.nombreEnCours > 1 ? "s" : ""} sur vos prochains reversements`
                      : "Aucune dépense en cours"}
                  </p>
                </Link>
                <Link
                  to="/espace-bailleur/depenses"
                  className={`rounded-xl border p-4 transition-colors ${depenses.duDirectement > 0 ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50" : "border-primary-100 bg-primary-50/40 hover:bg-primary-50"}`}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <PiggyBank size={14} aria-hidden="true" /> À régler à l&apos;agence
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">{formatMontant(depenses.duDirectement)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {depenses.nombreDues > 0 ? "Solde dû après la résiliation de votre mandat" : "Rien à régler directement"}
                  </p>
                </Link>
                <Link
                  to="/espace-bailleur/devis"
                  className={`rounded-xl border p-4 transition-colors ${depenses.devisEnAttente > 0 ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50" : "border-primary-100 bg-primary-50/40 hover:bg-primary-50"}`}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <FileCheck2 size={14} aria-hidden="true" /> Devis à valider
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">{depenses.devisEnAttente}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {depenses.devisEnAttente > 0 ? "Votre réponse est attendue" : "Aucun devis en attente de votre réponse"}
                  </p>
                </Link>
              </div>
            </Card>
          )}

          {(revenusChartData.length > 0 || repartitionChartData.length > 0) && (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {revenusChartData.length > 0 && (
                <Card title="Revenus récents" subtitle="Montants dus et reçus par période" className="lg:col-span-2">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenusChartData} barGap={6}>
                        <CartesianGrid vertical={false} stroke="var(--color-primary-100)" />
                        <XAxis dataKey="periode" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis tickFormatter={montantCompact} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} width={48} />
                        <Tooltip
                          cursor={{ fill: "var(--color-primary-50)" }}
                          formatter={(value) => formatMontant(typeof value === "number" ? value : Number(value))}
                          contentStyle={{ borderRadius: 12, border: "1px solid var(--color-primary-100)", fontSize: 13 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Dû" fill="var(--color-primary-200)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Reçu" fill="var(--color-primary-600)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {repartitionChartData.length > 0 && (
                <Card
                  title="Répartition"
                  subtitle="Statut de vos maisons"
                  className={revenusChartData.length === 0 ? "lg:col-span-3" : undefined}
                >
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={repartitionChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                          {repartitionChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-primary-100)", fontSize: 13 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
