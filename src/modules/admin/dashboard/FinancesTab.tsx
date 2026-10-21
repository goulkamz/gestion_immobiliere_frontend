import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, CalendarRange, Package, PieChart as PieIcone, Search, TrendingUp } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LoadingSpinner, Modal } from "@/components/ui";
import type { CategorieFinanceDTO } from "@/api/types";
import type { AdminStatsDTO } from "@/api/types";
import { useAdminBailleursCreanciersQuery, useAdminCreancesLocatairesQuery, useAdminFinancesQuery } from "@/hooks/queries/useStatsAdmin";
import { formatDate, formatMontant } from "@/utils/format";
import type { PeriodeCalculee } from "./periode";
import { BandeauStocks, BarreSegmentee, CarteGain, FriseAnciennete, Pastille, ProgressionGrande, SoftCard, TartePleine } from "./financeWidgets";
import type { PartTarte } from "./financeWidgets";
import { Figure, PorteeChip, RankedTable, TrendBadge } from "./widgets";
import { COULEURS_PARTS, TOOLTIP_STYLE, couleurTaux, montantCompact } from "./helpers";
import { SelecteurDuree } from "./evolution";
import { useSerieEvolution } from "./useSerieEvolution";

/** Catégories affichées dans le tableau ; les autres sont dans la fenêtre « Voir tout ». */
const CATEGORIES_VISIBLES = 5;
/** Catégories nommées dans la tarte avant de regrouper le reste en « Autres catégories ». */
const PARTS_CATEGORIES = 3;

function TableauCategories({ lignes, totalNet }: { lignes: CategorieFinanceDTO[]; totalNet: number }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white/70 ring-1 ring-primary-100/60">
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
          {lignes.map((c) => {
            const part = totalNet > 0 ? Math.round((Math.max(0, c.net) / totalNet) * 100) : 0;
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
  );
}

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
  const [categoriesOuvert, setCategoriesOuvert] = useState(false);
  const [rechercheCategorie, setRechercheCategorie] = useState("");

  const fin = finQuery.data;
  const prec = periode.precedente ? precQuery.data : undefined;
  const loyers = stats.loyers;
  const rev = stats.reversements;

  const sparkVolume = useMemo(() => points.slice(-7).map((p) => ({ libelle: p.libelle, valeur: p["Volume encaissé"] })), [points]);
  const sparkRevenu = useMemo(() => points.slice(-7).map((p) => ({ libelle: p.libelle, valeur: p["Revenu agence"] })), [points]);

  if (!fin) return <LoadingSpinner text="Chargement des finances…" />;

  const bs = fin.biensServices;
  const lp = fin.loyersPeriode;
  const rp = fin.reversementsPeriode;
  const totalNetBs = bs.parCategorie.reduce((s, c) => s + Math.max(0, c.net), 0);

  const categoriesPositives = bs.parCategorie.filter((c) => c.net > 0);
  const autresCategories = categoriesPositives.slice(PARTS_CATEGORIES);
  const partsBrutes = [
    { name: "Commissions", value: fin.commissionsAcquises },
    ...categoriesPositives.slice(0, PARTS_CATEGORIES).map((c) => ({ name: c.categorie, value: c.net })),
    ...(autresCategories.length > 0
      ? [{ name: `Autres catégories (${autresCategories.length})`, value: autresCategories.reduce((t, c) => t + c.net, 0) }]
      : []),
  ].filter((p) => p.value > 0);
  const parts: PartTarte[] = partsBrutes.map((p, i) => ({ ...p, ...COULEURS_PARTS[Math.min(i, COULEURS_PARTS.length - 1)]! }));

  const creances = (creancesQuery.data ?? []).slice().sort((a, b) => b.montantDu - a.montantDu);
  const totalCreances = creances.reduce((s, c) => s + c.montantDu, 0);
  const creanciers = (creanciersQuery.data ?? []).slice().sort((a, b) => b.montantDu - a.montantDu);
  const totalCreanciers = creanciers.reduce((s, c) => s + c.montantDu, 0);

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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(valeur) => <span className="text-slate-600">{valeur}</span>} />
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
              libelle="Recouvrement des loyers de la période"
              chip={<PorteeChip type="periode" />}
              pourcent={lp.tauxRecouvrement}
              couleur={couleurTaux(Math.round(lp.tauxRecouvrement))}
              detail={
                lp.nombreEcheances > 0
                  ? `${formatMontant(lp.encaissePeriode)} encaissés sur ${formatMontant(lp.dusPeriode)} de loyers échus dans la période`
                  : "Aucun loyer échu dans la période"
              }
            />
            <div className="mt-4">
              <BarreSegmentee
                message={
                  lp.nombreEcheances === 0
                    ? { texte: "Aucun loyer échu dans la période.", ton: "neutre" }
                    : lp.resteAEncaisser === 0
                      ? { texte: "Tous les loyers de la période sont encaissés.", ton: "ok" }
                      : undefined
                }
                segments={[
                  { label: "Encaissé", value: lp.encaissePeriode, color: "var(--color-success-600)", montant: formatMontant(lp.encaissePeriode) },
                  { label: "Reste à encaisser", value: lp.resteAEncaisser, color: "var(--color-danger-600)", montant: formatMontant(lp.resteAEncaisser) },
                ]}
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Loyers échus dans la période" value={formatMontant(lp.dusPeriode)} hint={`${lp.nombreEcheances} échéance${lp.nombreEcheances > 1 ? "s" : ""}`} />
              </div>
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Argent reçu pendant la période" value={formatMontant(fin.loyersEncaisses)} tone="text-success-700" />
                <TrendBadge actuel={fin.loyersEncaisses} precedent={prec?.loyersEncaisses} comparaison={periode.comparaison} />
              </div>
            </div>
            <BandeauStocks
              items={[
                {
                  label: "Reste à encaisser",
                  value: formatMontant(loyers.resteAEncaisser),
                  tone: loyers.resteAEncaisser > 0 ? "text-danger-700" : "text-success-700",
                  hint: loyers.nombreImpayesEchus > 0 ? `${loyers.nombreImpayesEchus} échéance(s) impayée(s)` : "Aucun loyer impayé",
                },
                { label: "Payé d'avance", value: formatMontant(loyers.payeAvance), tone: "text-primary-700", hint: "Loyers à venir déjà réglés" },
                { label: "À venir", value: formatMontant(loyers.aVenir), hint: "Pas encore exigibles" },
              ]}
            />
          </SoftCard>

          <SoftCard title="Reversements aux bailleurs" subtitle="Ce que l'agence verse aux bailleurs, et sa commission." icon={<ArrowUpFromLine size={16} />} className="h-full">
            <ProgressionGrande
              libelle="Part reversée des reversements de la période"
              chip={<PorteeChip type="periode" />}
              pourcent={rp.tauxReverse}
              couleur="var(--color-success-600)"
              detail={
                rp.nombreReversements > 0
                  ? `${formatMontant(rp.effectue)} reversés sur ${formatMontant(rp.totalPeriode)} dus dans la période`
                  : "Aucun reversement échu dans la période"
              }
            />
            <div className="mt-4">
              <BarreSegmentee
                message={
                  rp.nombreReversements === 0
                    ? { texte: "Aucun reversement échu dans la période.", ton: "neutre" }
                    : rp.aReverser === 0
                      ? { texte: "Tous les reversements de la période sont à jour.", ton: "ok" }
                      : undefined
                }
                segments={[
                  { label: "Reversé", value: rp.effectue, color: "var(--color-success-600)", montant: formatMontant(rp.effectue) },
                  { label: "À reverser", value: rp.aReverser, color: "var(--color-warning-600)", montant: formatMontant(rp.aReverser) },
                ]}
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Argent versé pendant la période" value={formatMontant(fin.reversementsEffectues)} />
                <TrendBadge actuel={fin.reversementsEffectues} precedent={prec?.reversementsEffectues} comparaison={periode.comparaison} />
              </div>
              <div className="rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
                <div className="mb-1"><PorteeChip type="periode" /></div>
                <Figure label="Commissions acquises" value={formatMontant(fin.commissionsAcquises)} tone="text-primary-700" hint={`${formatMontant(rev.commissionsPrevues)} prévues sur reversements non payés`} />
                <TrendBadge actuel={fin.commissionsAcquises} precedent={prec?.commissionsAcquises} comparaison={periode.comparaison} />
              </div>
            </div>
            <BandeauStocks
              items={[
                {
                  label: "À reverser maintenant",
                  value: formatMontant(rev.aReverser),
                  tone: rev.aReverser > 0 ? "text-warning-700" : "text-success-700",
                  hint: rev.nombreAReverser > 0 ? `${rev.nombreAReverser} échéance(s)` : "Rien à reverser",
                },
                {
                  label: "Avancé, loyers non encaissés",
                  value: formatMontant(rev.avanceSansLoyer),
                  tone: rev.avanceSansLoyer > 0 ? "text-warning-700" : "text-success-700",
                  hint: rev.nombreAvances > 0 ? `${rev.nombreAvances} reversement${rev.nombreAvances > 1 ? "s" : ""} payé${rev.nombreAvances > 1 ? "s" : ""} avant encaissement` : "Aucune avance",
                },
                { label: "À venir", value: formatMontant(rev.aVenir), hint: "Pas encore exigibles" },
              ]}
            />
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
            <div className="mt-5">
              <TableauCategories lignes={bs.parCategorie.slice(0, CATEGORIES_VISIBLES)} totalNet={totalNetBs} />
              {bs.parCategorie.length > CATEGORIES_VISIBLES && (
                <button
                  type="button"
                  onClick={() => setCategoriesOuvert(true)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
                >
                  Voir toutes les catégories ({bs.parCategorie.length})
                  <ArrowRight size={12} aria-hidden="true" />
                </button>
              )}
              <Modal isOpen={categoriesOuvert} onClose={() => setCategoriesOuvert(false)} title="Toutes les catégories" size="xl" titleTone="indigo">
                <div className="relative mb-3">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={rechercheCategorie}
                    onChange={(e) => setRechercheCategorie(e.target.value)}
                    placeholder="Rechercher une catégorie"
                    aria-label="Rechercher une catégorie"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800"
                  />
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  <TableauCategories
                    lignes={bs.parCategorie.filter((c) => c.categorie.toLowerCase().includes(rechercheCategorie.trim().toLowerCase()))}
                    totalNet={totalNetBs}
                  />
                </div>
              </Modal>
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
            subtitle="Reversements en retard"
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
