import { useMemo } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CalendarRange, Package, PieChart as PieIcone, TrendingUp } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LoadingSpinner } from "@/components/ui";
import type { AdminStatsDTO } from "@/api/types";
import { useAdminBailleursCreanciersQuery, useAdminCreancesLocatairesQuery, useAdminFinancesQuery } from "@/hooks/queries/useStatsAdmin";
import { formatDate, formatMontant } from "@/utils/format";
import type { PeriodeCalculee } from "./periode";
import { BarreSegmentee, CarteGain, FriseAnciennete, Pastille, ProgressionGrande, SoftCard, TartePleine } from "./financeWidgets";
import type { PartTarte } from "./financeWidgets";
import { Figure, PorteeChip, RankedTable, TrendBadge } from "./widgets";
import { TOOLTIP_STYLE, couleurTaux, montantCompact } from "./helpers";
import { SelecteurDuree } from "./evolution";
import { useSerieEvolution } from "./useSerieEvolution";

/** Parts de la tarte : indigo foncé et or en alternance, texte clair sur fond foncé et foncé sur fond clair. */
const COULEURS_PARTS: { color: string; text: string }[] = [
  { color: "var(--color-primary-800)", text: "#ffffff" },
  { color: "var(--color-accent-500)", text: "var(--color-primary-950)" },
  { color: "var(--color-primary-500)", text: "#ffffff" },
  { color: "var(--color-accent-300)", text: "var(--color-primary-950)" },
  { color: "var(--color-primary-300)", text: "var(--color-primary-950)" },
];

export function FinancesTab({
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
  const finQuery = useAdminFinancesQuery(periode.courante);
  const precQuery = useAdminFinancesQuery(periode.precedente);
  const creancesQuery = useAdminCreancesLocatairesQuery();
  const creanciersQuery = useAdminBailleursCreanciersQuery();
  const { points } = useSerieEvolution(nbMois);

  const fin = finQuery.data;
  const prec = periode.precedente ? precQuery.data : undefined;
  const loyers = stats.loyers;
  const rev = stats.reversements;
  const taux = Math.round(loyers.tauxRecouvrement);

  const sparkVolume = useMemo(() => points.slice(-7).map((p) => ({ libelle: p.libelle, valeur: p["Volume encaissé"] })), [points]);
  const sparkRevenu = useMemo(() => points.slice(-7).map((p) => ({ libelle: p.libelle, valeur: p["Revenu agence"] })), [points]);

  if (!fin) return <LoadingSpinner text="Chargement des finances…" />;

  const bs = fin.biensServices;
  const totalNetBs = bs.parCategorie.reduce((s, c) => s + Math.max(0, c.net), 0);

  const parts: PartTarte[] = [
    { name: "Commissions", value: fin.commissionsAcquises },
    ...bs.parCategorie.filter((c) => c.net > 0).map((c) => ({ name: c.categorie, value: c.net })),
  ]
    .filter((p) => p.value > 0)
    .map((p, i) => ({ ...p, ...COULEURS_PARTS[i % COULEURS_PARTS.length]! }));

  const creances = (creancesQuery.data ?? []).slice().sort((a, b) => b.montantDu - a.montantDu);
  const totalCreances = creances.reduce((s, c) => s + c.montantDu, 0);
  const creanciers = (creanciersQuery.data ?? []).slice().sort((a, b) => b.montantDu - a.montantDu);
  const totalCreanciers = creanciers.reduce((s, c) => s + c.montantDu, 0);

  const totalReversements = rev.effectue + rev.aReverser + rev.aVenir;
  const partReversee = totalReversements > 0 ? (rev.effectue / totalReversements) * 100 : 0;

  const anciennete = [
    { label: "0 à 30 jours", montant: loyers.anciennete.jours0a30, couleur: "var(--color-warning-500)" },
    { label: "31 à 60 jours", montant: loyers.anciennete.jours31a60, couleur: "var(--color-warning-600)" },
    { label: "61 à 90 jours", montant: loyers.anciennete.jours61a90, couleur: "var(--color-danger-500)" },
    { label: "Plus de 90 jours", montant: loyers.anciennete.plusDe90, couleur: "var(--color-danger-600)" },
  ];

  return (
    <div>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pastille>
            <CalendarRange size={13} className="text-primary-600" aria-hidden="true" />
            Période : {libellePeriode}
          </Pastille>
          <p className="text-xs text-slate-500">Les loyers ne sont pas des revenus : l'agence les reverse aux bailleurs, hors commission.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <CarteGain
            titre="Volume encaissé"
            valeur={fin.volumeEncaisse}
            precedent={prec?.volumeEncaisse}
            comparaison={periode.comparaison}
            note="L'argent qui transite par l'agence : loyers reçus et biens et services nets."
            serie={sparkVolume}
          />
          <CarteGain
            titre="Revenu de l'agence"
            valeur={fin.revenuAgence}
            precedent={prec?.revenuAgence}
            comparaison={periode.comparaison}
            note="Ce qui reste vraiment à l'agence : commissions acquises et biens et services nets."
            serie={sparkRevenu}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <SoftCard title="Origine du revenu" subtitle={`Période : ${libellePeriode}`} icon={<PieIcone size={16} />} className="h-full">
            <TartePleine parts={parts} />
          </SoftCard>

          <SoftCard
            title="Flux sur la durée"
            subtitle="Loyers reçus, reversements faits et commissions acquises."
            icon={<TrendingUp size={16} />}
            className="h-full lg:col-span-2"
            action={<SelecteurDuree valeur={nbMois} onChange={onNbMois} />}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-primary-100)" />
                  <XAxis dataKey="libelle" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={montantCompact} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ stroke: "var(--color-primary-300)", strokeDasharray: "4 4" }}
                    formatter={(v) => formatMontant(Number(v))}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" isAnimationActive={false} dataKey="Loyers encaissés" stroke="var(--color-primary-600)" strokeWidth={3} dot={{ r: 4, fill: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" isAnimationActive={false} dataKey="Reversements effectués" stroke="var(--color-accent-500)" strokeWidth={3} dot={{ r: 4, fill: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" isAnimationActive={false} dataKey="Commissions acquises" stroke="var(--color-success-600)" strokeWidth={3} dot={{ r: 4, fill: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SoftCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SoftCard title="Loyers à encaisser" subtitle="Ce que les locataires doivent à l'agence." icon={<ArrowDownToLine size={16} />} className="h-full">
            <ProgressionGrande
              libelle="Recouvrement des loyers dus à ce jour"
              pourcent={taux}
              couleur={couleurTaux(taux)}
              detail={`${formatMontant(loyers.encaisseSurEchu)} encaissés sur ${formatMontant(loyers.echuTotal)} dus`}
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Encaissé sur la période" value={formatMontant(fin.loyersEncaisses)} tone="text-success-700" />
                <TrendBadge actuel={fin.loyersEncaisses} precedent={prec?.loyersEncaisses} comparaison={periode.comparaison} />
              </div>
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="stock" /></div>
                <Figure
                  label="Reste à encaisser"
                  value={formatMontant(loyers.resteAEncaisser)}
                  tone={loyers.resteAEncaisser > 0 ? "text-danger-700" : "text-slate-900"}
                  hint={`${loyers.nombreImpayesEchus} échéance(s) impayée(s)`}
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              À venir, pas encore exigibles : <span className="font-semibold text-slate-700">{formatMontant(loyers.aVenir)}</span>
            </p>
          </SoftCard>

          <SoftCard title="Reversements aux bailleurs" subtitle="Ce que l'agence verse aux bailleurs, et sa commission." icon={<ArrowUpFromLine size={16} />} className="h-full">
            <ProgressionGrande
              libelle="Part déjà reversée"
              pourcent={partReversee}
              couleur="var(--color-primary-600)"
              detail={`${formatMontant(rev.effectue)} reversés sur ${formatMontant(totalReversements)} prévus au total`}
            />
            <div className="mt-4">
              <BarreSegmentee
                segments={[
                  { label: "Déjà reversé", value: rev.effectue, color: "var(--color-success-600)", montant: formatMontant(rev.effectue) },
                  { label: "À reverser maintenant", value: rev.aReverser, color: "var(--color-warning-600)", montant: formatMontant(rev.aReverser) },
                  { label: "À venir", value: rev.aVenir, color: "var(--color-primary-300)", montant: formatMontant(rev.aVenir) },
                ]}
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Reversé sur la période" value={formatMontant(fin.reversementsEffectues)} />
                <TrendBadge actuel={fin.reversementsEffectues} precedent={prec?.reversementsEffectues} comparaison={periode.comparaison} />
              </div>
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Commissions acquises" value={formatMontant(fin.commissionsAcquises)} tone="text-primary-700" hint={`${formatMontant(rev.commissionsPrevues)} prévues sur reversements non payés`} />
                <TrendBadge actuel={fin.commissionsAcquises} precedent={prec?.commissionsAcquises} comparaison={periode.comparaison} />
              </div>
            </div>
          </SoftCard>
        </div>

        <SoftCard
          title="Biens et services"
          subtitle="Revenus propres de l'agence, comptés à part : ils ne passent pas par les bailleurs."
          icon={<Package size={16} />}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Pastille>
              Encaissé <span className="font-bold text-success-700">{formatMontant(bs.encaisse)}</span>
            </Pastille>
            <Pastille>
              Remboursé <span className="font-bold text-slate-700">{formatMontant(bs.rembourse)}</span>
            </Pastille>
            <Pastille tone="accent">
              Net conservé <span className="font-bold">{formatMontant(bs.net)}</span>
            </Pastille>
            <Pastille>
              Locations payées <span className="font-bold text-slate-800">{bs.nbLocations}</span>
            </Pastille>
            <TrendBadge actuel={bs.net} precedent={prec?.biensServices.net} comparaison={periode.comparaison} />
          </div>

          {bs.parCategorie.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded-xl bg-white/70 ring-1 ring-primary-100/60">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-dashed border-primary-200 text-left text-xs font-bold uppercase tracking-wide text-primary-800">
                    <th className="px-4 py-2.5">Catégorie</th>
                    <th className="px-3 py-2.5 text-right">Locations</th>
                    <th className="px-3 py-2.5 text-right">Encaissé</th>
                    <th className="px-3 py-2.5 text-right">Remboursé</th>
                    <th className="px-3 py-2.5 text-right">Net</th>
                    <th className="px-4 py-2.5">Part du net</th>
                  </tr>
                </thead>
                <tbody>
                  {bs.parCategorie.map((c) => {
                    const part = totalNetBs > 0 ? Math.round((Math.max(0, c.net) / totalNetBs) * 100) : 0;
                    return (
                      <tr key={c.categorie} className="border-b border-dashed border-primary-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-800">{c.categorie}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{c.nbLocations}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{formatMontant(c.encaisse)}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{formatMontant(c.rembourse)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-primary-700">{formatMontant(c.net)}</td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-32 items-center gap-2">
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-100/70">
                              <div className="h-full rounded-full bg-linear-to-r from-primary-300 to-primary-700" style={{ width: `${Math.max(part, 3)}%` }} />
                            </div>
                            <span className="w-9 text-right text-xs font-semibold text-slate-600">{part} %</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-400">Aucun paiement de biens et services sur cette période.</p>
          )}
        </SoftCard>

        <div className="grid gap-5 lg:grid-cols-3">
          <SoftCard title="Ancienneté des impayés" subtitle="Loyers dus et non payés, selon le retard." icon={<AlertTriangle size={16} />} className="h-full">
            {loyers.resteAEncaisser === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Aucun loyer impayé.</p>
            ) : (
              <FriseAnciennete etapes={anciennete} />
            )}
          </SoftCard>

          <RankedTable
            soft
            title="Loyers impayés par locataire"
            subtitle="Loyers dont la date est passée et non soldés."
            icon={<AlertTriangle size={16} />}
            empty="Aucun locataire en retard."
            variant="avatar"
            rows={creances.map((c) => ({
              id: c.idLocataire,
              nom: c.nomComplet,
              detail: `${c.nbEcheancesEnRetard} échéance${c.nbEcheancesEnRetard > 1 ? "s" : ""} impayée${c.nbEcheancesEnRetard > 1 ? "s" : ""}`,
              valeur: formatMontant(c.montantDu),
              part: totalCreances > 0 ? c.montantDu / totalCreances : 0,
            }))}
            footer={{ label: `Total (${creances.length} locataire${creances.length > 1 ? "s" : ""})`, valeur: formatMontant(totalCreances) }}
          />

          <RankedTable
            soft
            title="Reversements dus aux bailleurs"
            subtitle="Reversements dont la date est passée et non effectués."
            icon={<ArrowUpFromLine size={16} />}
            empty="Aucun reversement en attente."
            variant="avatar"
            rows={creanciers.map((c) => ({
              id: c.idBailleur,
              nom: c.nomComplet,
              detail: `${c.nbMois} échéance${c.nbMois > 1 ? "s" : ""}, depuis le ${formatDate(c.plusAncienneEcheance)}`,
              valeur: formatMontant(c.montantDu),
              part: totalCreanciers > 0 ? c.montantDu / totalCreanciers : 0,
            }))}
            footer={{ label: `Total (${creanciers.length} bailleur${creanciers.length > 1 ? "s" : ""})`, valeur: formatMontant(totalCreanciers) }}
          />
        </div>
      </div>
    </div>
  );
}
