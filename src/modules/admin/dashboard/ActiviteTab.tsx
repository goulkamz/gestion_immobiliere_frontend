import type { ReactNode } from "react";
import { CalendarRange, FileSignature, Home, Inbox, Megaphone, Package, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActivitePeriodeDTO, AdminStatsDTO } from "@/api/types";
import { useAdminActiviteQuery } from "@/hooks/queries/useStatsAdmin";
import { statutLabel, statutToBadgeVariant } from "@/utils/statut";
import type { PeriodeCalculee } from "./periode";
import { Pastille, SoftCard } from "./financeWidgets";
import { PorteeChip, TrendBadge } from "./widgets";
import { TOOLTIP_STYLE } from "./helpers";
import { SelecteurDuree } from "./evolution";
import { useSerieEvolution } from "./useSerieEvolution";

const PILLS: Record<string, { box: string; dot: string }> = {
  success: { box: "bg-success-50 text-success-700", dot: "var(--color-success-600)" },
  warning: { box: "bg-warning-50 text-warning-700", dot: "var(--color-warning-600)" },
  danger: { box: "bg-danger-50 text-danger-700", dot: "var(--color-danger-600)" },
  info: { box: "bg-primary-50 text-primary-700", dot: "var(--color-primary-600)" },
  neutral: { box: "bg-slate-100 text-slate-600", dot: "#94a3b8" },
};

interface Sujet {
  titre: string;
  description: string;
  icone: ReactNode;
  repartition: Record<string, number>;
  /** Largeur de la carte sur la grille de 6 colonnes : 3 cartes en haut, 2 plus larges dessous. */
  largeur: string;
  /** Champ de l'activité de la période et libellé du compteur « nouveaux ». */
  cle: keyof Pick<ActivitePeriodeDTO, "mandats" | "contratsLocation" | "locationsBienService" | "annonces" | "demandes">;
  libelleNouveaux: string;
}

function StatutPastille({ statut, nombre }: { statut: string; nombre: number }) {
  const p = PILLS[statutToBadgeVariant(statut)] ?? PILLS.neutral!;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${p.box}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.dot }} aria-hidden="true" />
      {statutLabel(statut)}
      <span className="font-bold">{nombre}</span>
    </span>
  );
}

function CarteSujet({
  sujet,
  nouveaux,
  precedent,
  comparaison,
}: {
  sujet: Sujet;
  nouveaux: number | undefined;
  precedent: number | undefined;
  comparaison: string;
}) {
  const entrees = Object.entries(sujet.repartition);
  const total = entrees.reduce((s, [, n]) => s + n, 0);
  return (
    <SoftCard title={sujet.titre} subtitle={sujet.description} icon={sujet.icone} className={`h-full ${sujet.largeur}`}>
      <div className="flex items-baseline gap-2">
        <p className="font-heading text-4xl font-bold text-primary-700">{total}</p>
        <p className="text-xs text-slate-400">au total</p>
      </div>
      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Aucune donnée.</p>
      ) : (
        <>
          <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-primary-100/70 shadow-inner">
            {entrees
              .filter(([, n]) => n > 0)
              .map(([statut, n]) => (
                <div
                  key={statut}
                  style={{ width: `${(n / total) * 100}%`, background: (PILLS[statutToBadgeVariant(statut)] ?? PILLS.neutral!).dot }}
                  title={`${statutLabel(statut)} : ${n}`}
                />
              ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {entrees.map(([statut, n]) => (
              <StatutPastille key={statut} statut={statut} nombre={n} />
            ))}
          </div>
        </>
      )}
      <div className="mt-4 rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
        <div className="mb-1"><PorteeChip type="periode" /></div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-slate-500">{sujet.libelleNouveaux}</p>
          <p className="font-heading text-2xl font-bold text-primary-700">{nouveaux ?? "-"}</p>
        </div>
        {nouveaux !== undefined && <TrendBadge actuel={nouveaux} precedent={precedent} comparaison={comparaison} />}
      </div>
    </SoftCard>
  );
}

export function ActiviteTab({
  stats,
  periode,
  libellePeriode,
  nbMois,
  onNbMois,
}: {
  stats: AdminStatsDTO;
  periode: PeriodeCalculee;
  libellePeriode: string;
  nbMois: number;
  onNbMois: (n: number) => void;
}) {
  const { points } = useSerieEvolution(nbMois);
  const courante = useAdminActiviteQuery(periode.courante).data;
  const precedente = useAdminActiviteQuery(periode.precedente).data;

  const sujets: Sujet[] = [
    { titre: "Mandats", description: "Gestion confiée par les bailleurs", icone: <FileSignature size={16} />, repartition: stats.mandatsParStatut, largeur: "lg:col-span-2", cle: "mandats", libelleNouveaux: "Mandats créés" },
    { titre: "Contrats de location", description: "Maisons louées aux locataires", icone: <Home size={16} />, repartition: stats.contratsLocationParStatut, largeur: "lg:col-span-2", cle: "contratsLocation", libelleNouveaux: "Contrats créés" },
    { titre: "Biens et services", description: "Locations de véhicules, équipements…", icone: <Package size={16} />, repartition: stats.locationsBienServiceParStatut, largeur: "lg:col-span-2", cle: "locationsBienService", libelleNouveaux: "Locations créées" },
    { titre: "Annonces", description: "Publiées sur le site", icone: <Megaphone size={16} />, repartition: stats.annoncesParStatut, largeur: "lg:col-span-3", cle: "annonces", libelleNouveaux: "Annonces publiées" },
    { titre: "Demandes", description: "Reçues des visiteurs", icone: <Inbox size={16} />, repartition: stats.demandesParStatut, largeur: "sm:col-span-2 lg:col-span-3", cle: "demandes", libelleNouveaux: "Demandes reçues" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pastille>
          <CalendarRange size={13} className="text-primary-600" aria-hidden="true" />
          Période : {libellePeriode}
        </Pastille>
        <p className="text-xs text-slate-500">Les statuts montrent l'état à ce jour. Le bloc « période » compte ce qui a été créé pendant la période choisie.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {sujets.map((s) => (
          <CarteSujet
            key={s.titre}
            sujet={s}
            nouveaux={courante?.[s.cle]}
            precedent={periode.precedente ? precedente?.[s.cle] : undefined}
            comparaison={periode.comparaison}
          />
        ))}
      </div>

      <SoftCard
        title="Inscriptions et nouveaux contrats"
        subtitle="Par mois, contrats de location créés."
        icon={<TrendingUp size={16} />}
        action={<SelecteurDuree valeur={nbMois} onChange={onNbMois} />}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-primary-100)" />
              <XAxis dataKey="libelle" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-primary-50)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(valeur) => <span className="text-slate-600">{valeur}</span>} />
              <Bar dataKey="Inscriptions" fill="var(--color-primary-300)" radius={[8, 8, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              <Bar dataKey="Nouveaux contrats" fill="var(--color-primary-700)" radius={[8, 8, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SoftCard>
    </div>
  );
}
