import { Activity, AlertTriangle, ArrowUpFromLine, Building2, CalendarClock, Inbox, Mail, Percent, UserPlus, Users } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, StatCard } from "@/components/ui";
import type { AdminStatsDTO } from "@/api/types";
import { formatMontant } from "@/utils/format";
import { AttentionTile, GaugeCard, SectionTitle } from "./widgets";
import { TOOLTIP_STYLE, montantCompact } from "./helpers";
import { SelecteurDuree } from "./evolution";
import { useSerieEvolution } from "./useSerieEvolution";

export function OverviewTab({ stats, nbMois, onNbMois }: { stats: AdminStatsDTO; nbMois: number; onNbMois: (n: number) => void }) {
  const { points } = useSerieEvolution(nbMois);
  const loyers = stats.loyers;
  const rev = stats.reversements;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard compact label="Utilisateurs" value={stats.totalUtilisateurs} icon={<Users size={20} />} tone="primary" />
        <StatCard compact label="Inscrits ce mois-ci" value={stats.inscriptionsCeMois} icon={<UserPlus size={20} />} tone="accent" />
        <StatCard compact label="Connexions (7 jours)" value={stats.connexionsRecentes7j} icon={<Activity size={20} />} tone="success" />
        <StatCard compact label="Cours gérées" value={stats.totalCours} icon={<Building2 size={20} />} tone="warning" />
        <StatCard compact label="Occupation des maisons" value={`${Math.round(stats.tauxOccupationMaisons)} %`} icon={<Percent size={20} />} tone="primary" />
      </div>

      <SectionTitle>À traiter</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AttentionTile label="Loyers impayés" value={loyers.nombreImpayesEchus} icon={<AlertTriangle size={18} />} tone="danger" to="/espace-agent/echeances" />
        <AttentionTile label="Reversements à effectuer" value={rev.nombreAReverser} icon={<ArrowUpFromLine size={18} />} tone="warning" to="/espace-agent/reversements" />
        <AttentionTile label="Mandats expirant sous 30 jours" value={stats.mandatsExpirantSous30Jours} icon={<CalendarClock size={18} />} tone="warning" to="/espace-agent/mandats" />
        <AttentionTile label="Offres non traitées" value={stats.offresNonTraitees} icon={<Inbox size={18} />} tone="primary" to="/espace-agent/offres" />
        <AttentionTile label="Messages non lus" value={stats.contactsNonLus} icon={<Mail size={18} />} tone="primary" to="/espace-agent/contacts" />
      </div>

      <SectionTitle>Évolution et recouvrement</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Flux financiers"
          subtitle="Loyers reçus, reversements faits et commissions acquises."
          className="lg:col-span-2"
        >
          <div className="mb-2 flex justify-end">
            <SelecteurDuree valeur={nbMois} onChange={onNbMois} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-primary-100)" />
                <XAxis dataKey="libelle" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={montantCompact} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-primary-50)" }} formatter={(v) => formatMontant(Number(v))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(valeur) => <span className="text-slate-600">{valeur}</span>} />
                <Bar dataKey="Loyers encaissés" fill="var(--color-primary-600)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Reversements effectués" fill="var(--color-accent-500)" radius={[6, 6, 0, 0]} />
                <Line type="monotone" isAnimationActive={false} dataKey="Commissions acquises" stroke="var(--color-success-600)" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <GaugeCard
          title="Recouvrement des loyers"
          valeur={loyers.tauxRecouvrement}
          legende="Part des loyers dus à ce jour déjà encaissée"
          icon={<Percent size={16} />}
          lignes={[
            { label: "Dû à ce jour", value: formatMontant(loyers.echuTotal) },
            { label: "Encaissé", value: formatMontant(loyers.encaisseSurEchu) },
            { label: "Reste à encaisser", value: formatMontant(loyers.resteAEncaisser) },
          ]}
        />
      </div>
    </div>
  );
}
