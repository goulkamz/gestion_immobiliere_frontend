import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui";
import type { AdminStatsDTO } from "@/api/types";
import { statutLabel, statutToBadgeVariant } from "@/utils/statut";
import { SectionTitle } from "./widgets";
import { TOOLTIP_STYLE } from "./helpers";
import { SelecteurDuree } from "./evolution";
import { useSerieEvolution } from "./useSerieEvolution";

const PILLS: Record<string, { box: string; dot: string }> = {
  success: { box: "bg-success-50 text-success-700", dot: "var(--color-success-600)" },
  warning: { box: "bg-warning-50 text-warning-700", dot: "var(--color-warning-600)" },
  danger: { box: "bg-danger-50 text-danger-700", dot: "var(--color-danger-600)" },
  info: { box: "bg-primary-50 text-primary-700", dot: "var(--color-primary-600)" },
  neutral: { box: "bg-slate-100 text-slate-600", dot: "var(--color-slate-400, #94a3b8)" },
};

interface Ligne {
  sujet: string;
  description: string;
  repartition: Record<string, number>;
}

function Pastille({ statut, nombre }: { statut: string; nombre: number }) {
  const p = PILLS[statutToBadgeVariant(statut)] ?? PILLS.neutral!;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${p.box}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.dot }} aria-hidden="true" />
      {statutLabel(statut)}
      <span className="font-bold">{nombre}</span>
    </span>
  );
}

export function ActiviteTab({ stats, nbMois, onNbMois }: { stats: AdminStatsDTO; nbMois: number; onNbMois: (n: number) => void }) {
  const { points } = useSerieEvolution(nbMois);

  const lignes: Ligne[] = [
    { sujet: "Mandats", description: "Gestion confiée par les bailleurs", repartition: stats.mandatsParStatut },
    { sujet: "Contrats de location", description: "Maisons louées aux locataires", repartition: stats.contratsLocationParStatut },
    { sujet: "Locations de biens et services", description: "Véhicules, équipements…", repartition: stats.locationsBienServiceParStatut },
    { sujet: "Annonces", description: "Publiées sur le site", repartition: stats.annoncesParStatut },
    { sujet: "Demandes", description: "Reçues des visiteurs", repartition: stats.demandesParStatut },
  ];

  return (
    <div>
      <SectionTitle>Contrats et activité commerciale</SectionTitle>
      <Card title="Récapitulatif" subtitle="Où en est chaque activité, par statut.">
        <ul className="divide-y divide-slate-100">
          {lignes.map((l) => {
            const entrees = Object.entries(l.repartition);
            const total = entrees.reduce((s, [, n]) => s + n, 0);
            return (
              <li key={l.sujet} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,14rem)_5rem_minmax(0,1fr)] sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{l.sujet}</p>
                  <p className="text-xs text-slate-400">{l.description}</p>
                </div>
                <p className="font-heading text-2xl font-bold text-primary-700 sm:text-center">{total}</p>
                {total === 0 ? (
                  <p className="text-sm text-slate-400">Aucune donnée.</p>
                ) : (
                  <div>
                    <div className="mb-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
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
                    <div className="flex flex-wrap gap-1.5">
                      {entrees.map(([statut, n]) => (
                        <Pastille key={statut} statut={statut} nombre={n} />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <SectionTitle>Évolution de l'activité</SectionTitle>
      <Card title="Inscriptions et nouveaux contrats" subtitle="Par mois, contrats de location créés.">
        <div className="mb-2 flex justify-end">
          <SelecteurDuree valeur={nbMois} onChange={onNbMois} />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-primary-100)" />
              <XAxis dataKey="libelle" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-primary-50)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Inscriptions" fill="var(--color-primary-400)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Nouveaux contrats" fill="var(--color-success-600)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
