import { useMemo } from "react";
import { MapPin, Trophy } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import type { AdminStatsDTO } from "@/api/types";
import { useAdminTopBailleursQuery, useAdminVillesQuery } from "@/hooks/queries/useStatsAdmin";
import { formatMontant } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import type { PeriodeCalculee } from "./periode";
import { DonutCard, PorteeChip, RankedTable, SectionTitle } from "./widgets";
import { STATUT_COLORS, toSlices } from "./helpers";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Clients",
  BAILLEUR: "Bailleurs",
  AGENT: "Agents",
  ADMIN: "Administrateurs",
};

export function PatrimoineTab({ stats, periode, libellePeriode }: { stats: AdminStatsDTO; periode: PeriodeCalculee; libellePeriode: string }) {
  const villesQuery = useAdminVillesQuery(periode.courante);
  const topQuery = useAdminTopBailleursQuery();

  const maisons = useMemo(() => toSlices(stats.maisonsParStatut, statutLabel, STATUT_COLORS), [stats]);
  const roles = useMemo(() => toSlices(stats.utilisateursParRole, (k) => ROLE_LABELS[k.replace("ROLE_", "")] ?? statutLabel(k)), [stats]);

  const categories = useMemo(
    () =>
      Object.entries(stats.biensServiceParDisponibilite ?? {})
        .map(([categorie, parDispo]) => {
          const total = Object.values(parDispo).reduce((s, n) => s + n, 0);
          const louees = parDispo["LOUEE"] ?? 0;
          return {
            categorie,
            total,
            occupation: total > 0 ? Math.round((louees / total) * 100) : 0,
            slices: toSlices(parDispo, statutLabel, STATUT_COLORS),
          };
        })
        .sort((a, b) => b.total - a.total),
    [stats],
  );

  const villes = villesQuery.data ?? [];
  const maxVolume = Math.max(1, ...villes.map((v) => v.volumeEncaisse));
  const total = villes.reduce(
    (t, v) => ({
      maisons: t.maisons + v.nbMaisons,
      locataires: t.locataires + v.nbLocatairesActifs,
      loyers: t.loyers + v.loyersEncaisses,
      bs: t.bs + v.biensServicesNet,
      volume: t.volume + v.volumeEncaisse,
      revenu: t.revenu + v.revenuAgence,
      impayes: t.impayes + v.impayesEchus,
    }),
    { maisons: 0, locataires: 0, loyers: 0, bs: 0, volume: 0, revenu: 0, impayes: 0 },
  );

  const topBailleurs = topQuery.data ?? [];
  const totalLoyersBailleurs = topBailleurs.reduce((s, b) => s + b.loyersEncaisses, 0);

  return (
    <div>
      <SectionTitle hint={`Valeurs de la période : ${libellePeriode}`}>Ce que rapporte chaque ville</SectionTitle>
      <Card
        title="Valeur par ville"
        subtitle="Une ville est rattachée par le secteur de ses maisons, de ses cours sous mandat et de ses biens et services."
        icon={<MapPin size={18} className="text-primary-600" />}
      >
        {villes.length === 0 ? (
          <EmptyState title="Aucune ville renseignée" description="Les statistiques par ville apparaîtront ici." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Ville</th>
                  <th className="px-3 py-2 text-right">Maisons</th>
                  <th className="px-3 py-2 text-right">Locataires</th>
                  <th className="px-3 py-2 text-right">Loyers encaissés</th>
                  <th className="px-3 py-2 text-right">Biens et services</th>
                  <th className="px-3 py-2">Volume encaissé</th>
                  <th className="px-3 py-2 text-right">Revenu agence</th>
                  <th className="py-2 pl-3 text-right">
                    Impayés <PorteeChip type="stock" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {villes.map((v, i) => (
                  <tr key={v.nomVille} className="align-middle">
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2 font-medium text-slate-800">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            i === 0 ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {v.nomVille}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">{v.nbMaisons}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{v.nbLocatairesActifs}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{formatMontant(v.loyersEncaisses)}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{formatMontant(v.biensServicesNet)}</td>
                    <td className="px-3 py-3">
                      <div className="min-w-36">
                        <p className="font-semibold text-slate-900">{formatMontant(v.volumeEncaisse)}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(2, Math.round((v.volumeEncaisse / maxVolume) * 100))}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-primary-700">{formatMontant(v.revenuAgence)}</td>
                    <td className={`py-3 pl-3 text-right ${v.impayesEchus > 0 ? "font-semibold text-danger-700" : "text-slate-400"}`}>
                      {formatMontant(v.impayesEchus)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
                  <td className="py-3 pr-3">Total</td>
                  <td className="px-3 py-3 text-right">{total.maisons}</td>
                  <td className="px-3 py-3 text-right">{total.locataires}</td>
                  <td className="px-3 py-3 text-right">{formatMontant(total.loyers)}</td>
                  <td className="px-3 py-3 text-right">{formatMontant(total.bs)}</td>
                  <td className="px-3 py-3">{formatMontant(total.volume)}</td>
                  <td className="px-3 py-3 text-right text-primary-700">{formatMontant(total.revenu)}</td>
                  <td className="py-3 pl-3 text-right">{formatMontant(total.impayes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <SectionTitle>Parc et comptes</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <DonutCard title="Maisons par statut" subtitle="Répartition du parc géré." slices={maisons} centerLabel="maisons" />
        <DonutCard title="Utilisateurs par rôle" subtitle="Composition des comptes actifs." slices={roles} centerLabel="comptes" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RankedTable
          title="Top bailleurs"
          subtitle="Par nombre de maisons, avec les loyers encaissés."
          icon={<Trophy size={18} className="text-accent-500" />}
          empty="Aucun bailleur pour le moment."
          rows={topBailleurs.map((b) => ({
            id: b.idBailleur,
            nom: b.nomComplet,
            detail: `${b.nbMaisons} maison${b.nbMaisons > 1 ? "s" : ""}`,
            valeur: formatMontant(b.loyersEncaisses),
            part: totalLoyersBailleurs > 0 ? b.loyersEncaisses / totalLoyersBailleurs : 0,
          }))}
        />

        <Card title="Biens et services par catégorie" subtitle="Disponibilité et taux d'occupation." className="h-full">
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun bien ou service.</p>
          ) : (
            <ul className="space-y-4">
              {categories.map((c) => (
                <li key={c.categorie}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{c.categorie}</span>
                    <span className="text-xs text-slate-400">
                      {c.total} au total · <span className="font-semibold text-slate-700">{c.occupation} % loués</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                    {c.slices
                      .filter((s) => s.value > 0)
                      .map((s) => (
                        <div key={s.name} style={{ width: `${(s.value / c.total) * 100}%`, background: s.color }} title={`${s.name} : ${s.value}`} />
                      ))}
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    {c.slices.map((s) => (
                      <li key={s.name} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                        {s.name} {s.value}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
