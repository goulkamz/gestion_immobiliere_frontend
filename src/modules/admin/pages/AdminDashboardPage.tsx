import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Coins, LayoutDashboard, MapPin, Receipt, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui";
import { useSessionStore } from "@/store/sessionStore";
import { statsAdminApi } from "@/api/stats-admin";
import { useAdminFinancesQuery, useAdminStatsQuery } from "@/hooks/queries/useStatsAdmin";
import { formatMontant } from "@/utils/format";
import { ActiviteTab } from "@/modules/admin/dashboard/ActiviteTab";
import { FinancesTab } from "@/modules/admin/dashboard/FinancesTab";
import { OverviewTab } from "@/modules/admin/dashboard/OverviewTab";
import { PatrimoineTab } from "@/modules/admin/dashboard/PatrimoineTab";
import { PERIODES, calculerPeriode } from "@/modules/admin/dashboard/periode";
import type { PeriodeId } from "@/modules/admin/dashboard/periode";
import { couleurTaux } from "@/modules/admin/dashboard/helpers";
import { Onglets, TrendBadge } from "@/modules/admin/dashboard/widgets";

/**
 * Dans le tableau de bord, l'« attention » est en ambre et le « danger » reste rouge : l'orange du thème est trop
 * proche du rouge pour les distinguer sur les barres, les pastilles et la frise d'ancienneté. Le remplacement ne vaut
 * que pour les éléments de cette page (les autres espaces gardent la palette du thème).
 */
const PALETTE_ATTENTION = {
  "--color-warning-50": "#fffbeb",
  "--color-warning-500": "#f59e0b",
  "--color-warning-600": "#d97706",
  "--color-warning-700": "#b45309",
} as CSSProperties;

const dateHeaderFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

type OngletId = "ensemble" | "finances" | "patrimoine" | "activite";

const ONGLETS: { id: OngletId; label: string; icon: React.ReactNode }[] = [
  { id: "ensemble", label: "Vue d'ensemble", icon: <LayoutDashboard size={16} /> },
  { id: "finances", label: "Finances", icon: <Coins size={16} /> },
  { id: "patrimoine", label: "Patrimoine et villes", icon: <MapPin size={16} /> },
  { id: "activite", label: "Activité", icon: <Receipt size={16} /> },
];

export function AdminDashboardPage() {
  const prenom = useSessionStore((s) => s.profile?.prenom);
  const [onglet, setOnglet] = useState<OngletId>("ensemble");
  const [periodeId, setPeriodeId] = useState<PeriodeId>("mois");
  const [nbMois, setNbMois] = useState<number>(12);
  const [actualisation, setActualisation] = useState(false);
  const queryClient = useQueryClient();

  /** Les chiffres sont gardés 60 s côté serveur : on vide ce cache puis on redemande tout. */
  async function actualiser() {
    setActualisation(true);
    try {
      await statsAdminApi.viderCache();
      await queryClient.invalidateQueries({ queryKey: ["stats-admin"] });
    } finally {
      setActualisation(false);
    }
  }

  const periode = useMemo(() => calculerPeriode(periodeId), [periodeId]);
  const libellePeriode = PERIODES.find((p) => p.id === periodeId)?.label.toLowerCase() ?? "";

  const statsQuery = useAdminStatsQuery();
  const finQuery = useAdminFinancesQuery(periode.courante);
  const precQuery = useAdminFinancesQuery(periode.precedente);

  const stats = statsQuery.data;
  const fin = finQuery.data;
  const prec = periode.precedente ? precQuery.data : undefined;
  const taux = Math.round(stats?.loyers.tauxRecouvrement ?? 0);

  if (statsQuery.isLoading || !stats) return <LoadingSpinner text="Chargement du tableau de bord…" />;

  return (
    <div style={PALETTE_ATTENTION}>
      <div className="mb-6 rounded-2xl bg-linear-to-br from-primary-700 to-primary-900 px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-200">{dateHeaderFormatter.format(new Date())}</p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-white">
          Bonjour, <span className="text-accent-400">{prenom ?? "vous"}</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-accent-400">Vue d'ensemble de l'activité, des finances et des utilisateurs de l'agence.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-primary-200">Volume encaissé ({libellePeriode})</p>
            <p className="font-heading text-xl font-bold text-white">{formatMontant(fin?.volumeEncaisse ?? 0)}</p>
            <TrendBadge actuel={fin?.volumeEncaisse ?? 0} precedent={prec?.volumeEncaisse} comparaison={periode.comparaison} onDark />
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-primary-200">Revenu de l'agence ({libellePeriode})</p>
            <p className="font-heading text-xl font-bold text-accent-400">{formatMontant(fin?.revenuAgence ?? 0)}</p>
            <TrendBadge actuel={fin?.revenuAgence ?? 0} precedent={prec?.revenuAgence} comparaison={periode.comparaison} onDark />
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs text-primary-200">Recouvrement des loyers à ce jour</p>
            <p className="font-heading text-xl font-bold" style={{ color: couleurTaux(taux) }}>
              {taux} %
            </p>
            <p className="text-[11px] text-primary-200">{formatMontant(stats.loyers.resteAEncaisser)} restent à encaisser</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Onglets onglets={ONGLETS} actif={onglet} onChange={setOnglet} />
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={actualiser}
          disabled={actualisation}
          className="inline-flex items-center gap-2 rounded-xl border border-primary-100/60 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-primary-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={actualisation ? "animate-spin text-primary-600" : "text-primary-600"} aria-hidden="true" />
          Actualiser
        </button>
        <label className="inline-flex items-center gap-2 rounded-xl border border-primary-100/60 bg-white px-3 py-1.5 shadow-sm">
          <CalendarRange size={16} className="text-primary-600" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Période</span>
          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value as PeriodeId)}
            className="rounded-md bg-transparent py-1 text-sm font-medium text-slate-800 focus:outline-none"
            aria-label="Période des flux financiers"
          >
            {PERIODES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        </div>
      </div>

      <div className="mt-6">
        {onglet === "ensemble" && <OverviewTab stats={stats} nbMois={nbMois} onNbMois={setNbMois} />}
        {onglet === "finances" && <FinancesTab stats={stats} periode={periode} libellePeriode={libellePeriode} nbMois={nbMois} onNbMois={setNbMois} />}
        {onglet === "patrimoine" && <PatrimoineTab stats={stats} periode={periode} libellePeriode={libellePeriode} />}
        {onglet === "activite" && <ActiviteTab stats={stats} periode={periode} libellePeriode={libellePeriode} nbMois={nbMois} onNbMois={setNbMois} />}
      </div>
    </div>
  );
}
