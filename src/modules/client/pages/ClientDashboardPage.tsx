import { useMemo } from "react";
import { CalendarCheck, AlertTriangle, Undo2, Clock } from "lucide-react";
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
import { useReservationsQuery } from "@/hooks/queries/useReservations";
import { useClientEcheancesStatsQuery, useClientRemboursementsStatsQuery } from "@/hooks/queries/useStatsClient";
import { formatDate, formatMontant } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import { montantCompact } from "@/modules/admin/dashboard/helpers";

const dateHeaderFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const STATUT_CHART_COLORS: Record<string, string> = {
  PAYE: "var(--color-success-600)",
  EN_ATTENTE: "var(--color-warning-600)",
  EN_RETARD: "var(--color-danger-600)",
};

export function ClientDashboardPage() {
  const prenom = useSessionStore((s) => s.profile?.prenom);
  const reservationsQuery = useReservationsQuery({ size: 100 });
  const echeancesQuery = useClientEcheancesStatsQuery();
  const remboursementsQuery = useClientRemboursementsStatsQuery();

  const isLoading = reservationsQuery.isLoading || echeancesQuery.isLoading || remboursementsQuery.isLoading;

  const reservationsEnAttente = reservationsQuery.data?.content.filter((r) => r.statut === "EN_ATTENTE").length ?? 0;
  const echeancesEnRetard = echeancesQuery.data?.filter((e) => e.statut === "EN_RETARD").length ?? 0;
  // Avec plusieurs locations, plusieurs échéances tombent le même jour : on additionne ce qui reste à payer ce jour-là
  const prochaineEcheance = useMemo(() => {
    const impayees = (echeancesQuery.data ?? [])
      .filter((e) => e.statut !== "PAYE")
      .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance));
    const premiere = impayees[0];
    if (!premiere) return null;
    const date = premiere.dateEcheance;
    const duJour = impayees.filter((e) => e.dateEcheance === date);
    return {
      date,
      reste: duJour.reduce((somme, e) => somme + (e.montantDu - e.montantPaye), 0),
      nbMaisons: new Set(duJour.map((e) => e.nomCommunMaison ?? e.idEcheance)).size,
    };
  }, [echeancesQuery.data]);
  const totalRembourse = remboursementsQuery.data?.reduce((sum, r) => sum + r.montant, 0) ?? 0;

  const echeancesChartData = useMemo(() => {
    // Une barre par période : les échéances de toutes les maisons du même mois sont additionnées
    const parPeriode = new Map<string, { periode: string; "Dû": number; "Payé": number }>();
    const list = [...(echeancesQuery.data ?? [])].sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance));
    for (const e of list) {
      const ligne = parPeriode.get(e.dateEcheance) ?? {
        periode: e.moisLibelle ?? new Date(e.dateEcheance).toLocaleDateString("fr-FR", { month: "short" }),
        "Dû": 0,
        "Payé": 0,
      };
      ligne["Dû"] += e.montantDu;
      ligne["Payé"] += e.montantPaye;
      parPeriode.set(e.dateEcheance, ligne);
    }
    return Array.from(parPeriode.values()).slice(-6);
  }, [echeancesQuery.data]);

  const repartitionChartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of echeancesQuery.data ?? []) counts.set(e.statut, (counts.get(e.statut) ?? 0) + 1);
    return Array.from(counts.entries()).map(([statut, value]) => ({
      name: statutLabel(statut),
      value,
      color: STATUT_CHART_COLORS[statut] ?? "var(--color-primary-400)",
    }));
  }, [echeancesQuery.data]);

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-linear-to-br from-primary-700 to-primary-900 px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-200">
          {dateHeaderFormatter.format(new Date())}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-white">
          Bonjour, <span className="text-accent-400">{prenom ?? "vous"}</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-accent-400">
          Voici l&apos;essentiel de votre activité locative, réuni en un seul coup d&apos;œil.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Chargement de votre tableau de bord…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Réservations en attente"
              value={reservationsEnAttente}
              icon={<CalendarCheck size={20} />}
              tone="primary"
            />
            <StatCard
              label="Prochaine échéance"
              detail={
                prochaineEcheance
                  ? `${formatDate(prochaineEcheance.date)}${prochaineEcheance.nbMaisons > 1 ? `, ${prochaineEcheance.nbMaisons} maisons` : ""}`
                  : undefined
              }
              value={prochaineEcheance ? formatMontant(prochaineEcheance.reste) : "-"}
              icon={<Clock size={20} />}
              tone="accent"
            />
            <StatCard label="Échéances en retard" value={echeancesEnRetard} icon={<AlertTriangle size={20} />} tone="danger" />
            <StatCard label="Total remboursé" value={formatMontant(totalRembourse)} icon={<Undo2 size={20} />} tone="success" />
          </div>

          {echeancesChartData.length > 0 && (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <Card title="Échéances récentes" subtitle="Montants dus et payés par période" className="lg:col-span-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={echeancesChartData} barGap={6}>
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
                      <Bar dataKey="Payé" fill="var(--color-primary-600)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Répartition" subtitle="Statut de vos échéances">
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
