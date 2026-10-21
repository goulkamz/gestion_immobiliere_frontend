import { useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarRange, Home, MapPin, Package, PieChart as PieIcone, Search, Trophy, Users } from "lucide-react";
import { LoadingSpinner, Modal } from "@/components/ui";
import type { AdminStatsDTO, VilleStatsDTO } from "@/api/types";
import { useAdminTopBailleursQuery, useAdminVillesQuery } from "@/hooks/queries/useStatsAdmin";
import { formatMontant } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import type { PeriodeCalculee } from "./periode";
import { Pastille, SoftCard, TartePleine } from "./financeWidgets";
import type { PartTarte } from "./financeWidgets";
import { DonutCard, RankedTable } from "./widgets";
import { COULEURS_PARTS, STATUT_COLORS, toSlices } from "./helpers";
import type { Slice } from "./helpers";

/** Statuts d'une maison, dans l'ordre d'affichage. */
const STATUTS_MAISON = ["DISPONIBLE", "LOUEE", "RESERVEE", "EN_MAINTENANCE"];
const ROLES = ["ROLE_CLIENT", "ROLE_BAILLEUR", "ROLE_AGENT", "ROLE_ADMIN"];

/** Ajoute à 0 les clés attendues absentes, en gardant celles que le serveur renvoie en plus. */
function completer(valeurs: Record<string, number>, attendues: string[]): Record<string, number> {
  const complet: Record<string, number> = Object.fromEntries(attendues.map((k) => [k, 0]));
  for (const [k, n] of Object.entries(valeurs)) complet[k] = (complet[k] ?? 0) + n;
  return complet;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Clients",
  BAILLEUR: "Bailleurs",
  AGENT: "Agents",
  ADMIN: "Administrateurs",
};

/** Nombre de catégories affichées dans la carte ; les autres sont dans la fenêtre « Voir tout ». */
const CATEGORIES_VISIBLES = 4;

interface CategorieBien {
  categorie: string;
  total: number;
  occupation: number;
  slices: Slice[];
}

function ListeCategories({ categories }: { categories: CategorieBien[] }) {
  return (
    <ul className="space-y-5">
      {categories.map((c) => (
        <li key={c.categorie}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">
              {c.categorie} <span className="text-xs font-normal text-slate-400">· {c.total} au total</span>
            </span>
            <span className="font-heading text-xl font-bold text-primary-700">
              {c.occupation}
              <span className="text-sm">%</span> <span className="text-[11px] font-normal text-slate-400">loués</span>
            </span>
          </div>
          <div className="mt-1.5 flex h-3 gap-0.5 overflow-hidden rounded-full bg-primary-100/70 shadow-inner">
            {c.slices
              .filter((s) => s.value > 0)
              .map((s) => (
                <div key={s.name} style={{ width: `${(s.value / c.total) * 100}%`, background: s.color }} title={`${s.name} : ${s.value}`} />
              ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {c.slices.map((s) => (
              <li key={s.name} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                {s.name} <span className="font-semibold text-slate-700">{s.value}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** Nombre de villes affichées dans la carte ; les autres sont dans la fenêtre « Voir tout ». */
const VILLES_VISIBLES = 5;
/** Parts de la tarte avant de regrouper le reste en « Autres villes » (la dernière couleur est réservée à ce regroupement). */
const PARTS_VILLES = 4;

interface LigneVille {
  ville: VilleStatsDTO;
  rang: number;
}

interface TotauxVilles {
  maisons: number;
  locataires: number;
  volume: number;
  revenu: number;
  impayes: number;
}

function TableauVilles({ lignes, maxVolume, total }: { lignes: LigneVille[]; maxVolume: number; total: TotauxVilles }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white/70 ring-1 ring-primary-100/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dashed border-primary-200 text-left text-xs font-bold uppercase tracking-wide text-primary-800">
            <th className="px-4 py-2.5">Ville</th>
            <th className="px-3 py-2.5 text-right">Maisons</th>
            <th className="px-3 py-2.5 text-right">Locataires</th>
            <th className="px-3 py-2.5">Volume encaissé</th>
            <th className="px-3 py-2.5 text-right">Revenu agence</th>
            <th className="px-4 py-2.5 text-right">
              Impayés
              <span className="block text-[10px] font-medium normal-case tracking-normal text-slate-400">à ce jour</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map(({ ville: v, rang }) => (
            <tr key={v.nomVille} className="border-b border-dashed border-primary-100 align-middle">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 whitespace-nowrap font-medium text-slate-800">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      rang === 1 ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"
                    }`}
                  >
                    {rang}
                  </span>
                  {v.nomVille}
                </span>
              </td>
              <td className="px-3 py-3 text-right text-slate-700">{v.nbMaisons}</td>
              <td className="px-3 py-3 text-right text-slate-700">{v.nbLocatairesActifs}</td>
              <td className="px-3 py-3">
                <div className="min-w-48">
                  <p className="font-semibold text-slate-900">{formatMontant(v.volumeEncaisse)}</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary-100/70">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-primary-300 to-primary-700"
                      style={{ width: `${Math.max(3, Math.round((v.volumeEncaisse / maxVolume) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    loyers {formatMontant(v.loyersEncaisses)} · biens et services {formatMontant(v.biensServicesNet)}
                  </p>
                </div>
              </td>
              <td className="px-3 py-3 text-right font-semibold text-primary-700">{formatMontant(v.revenuAgence)}</td>
              <td className={`px-4 py-3 text-right ${v.impayesEchus > 0 ? "font-semibold text-danger-700" : "text-slate-400"}`}>
                {formatMontant(v.impayesEchus)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold text-slate-900">
            <td className="px-4 py-3">Total ({total.maisons} maison{total.maisons > 1 ? "s" : ""})</td>
            <td className="px-3 py-3 text-right">{total.maisons}</td>
            <td className="px-3 py-3 text-right">{total.locataires}</td>
            <td className="px-3 py-3">{formatMontant(total.volume)}</td>
            <td className="px-3 py-3 text-right text-primary-700">{formatMontant(total.revenu)}</td>
            <td className="px-4 py-3 text-right">{formatMontant(total.impayes)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function PatrimoineTab({ stats, periode, libellePeriode }: { stats: AdminStatsDTO; periode: PeriodeCalculee; libellePeriode: string }) {
  const villesQuery = useAdminVillesQuery(periode.courante);
  const topQuery = useAdminTopBailleursQuery();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [categoriesOuvert, setCategoriesOuvert] = useState(false);
  const [rechercheCategorie, setRechercheCategorie] = useState("");

  // Tous les statuts et tous les rôles figurent dans la légende, même à 0 : on voit ce qui existe et ce qui est vide.
  const maisons = useMemo(() => toSlices(completer(stats.maisonsParStatut, STATUTS_MAISON), statutLabel, STATUT_COLORS), [stats]);
  const roles = useMemo(
    () => toSlices(completer(stats.utilisateursParRole, ROLES), (k) => ROLE_LABELS[k.replace("ROLE_", "")] ?? statutLabel(k)),
    [stats],
  );

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
      volume: t.volume + v.volumeEncaisse,
      revenu: t.revenu + v.revenuAgence,
      impayes: t.impayes + v.impayesEchus,
    }),
    { maisons: 0, locataires: 0, volume: 0, revenu: 0, impayes: 0 },
  );

  const lignesVilles: LigneVille[] = villes.map((ville, i) => ({ ville, rang: i + 1 }));
  const lignesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? lignesVilles.filter((l) => l.ville.nomVille.toLowerCase().includes(q)) : lignesVilles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villes, recherche]);

  const villesAvecVolume = villes.filter((v) => v.volumeEncaisse > 0);
  const autresVilles = villesAvecVolume.slice(PARTS_VILLES);
  const partsVilles: PartTarte[] = [
    ...villesAvecVolume.slice(0, PARTS_VILLES).map((v, i) => ({ name: v.nomVille, value: v.volumeEncaisse, ...COULEURS_PARTS[i]! })),
    ...(autresVilles.length > 0
      ? [{ name: `Autres villes (${autresVilles.length})`, value: autresVilles.reduce((t, v) => t + v.volumeEncaisse, 0), ...COULEURS_PARTS[PARTS_VILLES]! }]
      : []),
  ];

  const topBailleurs = topQuery.data ?? [];
  const totalLoyersBailleurs = topBailleurs.reduce((s, b) => s + b.loyersEncaisses, 0);

  if (villesQuery.isLoading && !villesQuery.data) return <LoadingSpinner text="Chargement des villes…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pastille>
          <CalendarRange size={13} className="text-primary-600" aria-hidden="true" />
          Période : {libellePeriode}
        </Pastille>
        <Pastille>
          <Home size={13} className="text-primary-600" aria-hidden="true" />
          <span className="font-bold text-slate-900">{total.maisons}</span> maisons
        </Pastille>
        <Pastille>
          <Users size={13} className="text-primary-600" aria-hidden="true" />
          <span className="font-bold text-slate-900">{total.locataires}</span> locataires actifs
        </Pastille>
        <Pastille>
          <Building2 size={13} className="text-primary-600" aria-hidden="true" />
          <span className="font-bold text-slate-900">{stats.totalCours}</span> cours
        </Pastille>
        <Pastille tone="accent">
          Occupation <span className="font-bold">{Math.round(stats.tauxOccupationMaisons)} %</span>
        </Pastille>
      </div>

      <SoftCard
        title="Ce que rapporte chaque ville"
        subtitle={
          villes.length > VILLES_VISIBLES
            ? `Les ${VILLES_VISIBLES} premières sur ${villes.length}, classées par volume encaissé.`
            : "Rattachée par le secteur des maisons, des cours sous mandat et des biens et services."
        }
        icon={<MapPin size={16} />}
        className="h-full"
      >
        {villes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Aucune ville renseignée pour le moment.</p>
        ) : (
          <>
            <TableauVilles lignes={lignesVilles.slice(0, VILLES_VISIBLES)} maxVolume={maxVolume} total={total} />
            {villes.length > VILLES_VISIBLES && (
              <button
                type="button"
                onClick={() => setOuvert(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                Voir toutes les villes ({villes.length})
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            )}
            <Modal isOpen={ouvert} onClose={() => setOuvert(false)} title="Toutes les villes" size="xl" titleTone="indigo">
              <div className="relative mb-3">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher une ville"
                  aria-label="Rechercher une ville"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800"
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {lignesFiltrees.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">Aucun résultat.</p>
                ) : (
                  <TableauVilles lignes={lignesFiltrees} maxVolume={maxVolume} total={total} />
                )}
              </div>
            </Modal>
          </>
        )}
      </SoftCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SoftCard title="Part de chaque ville" subtitle={`Volume encaissé, ${libellePeriode}`} icon={<PieIcone size={16} />} className="h-full">
          <TartePleine parts={partsVilles} />
        </SoftCard>
        <DonutCard soft vertical icon={<Home size={16} />} title="Maisons par statut" subtitle="Répartition du parc géré." slices={maisons} centerLabel="maisons" />
        <DonutCard soft vertical icon={<Users size={16} />} title="Utilisateurs par rôle" subtitle="Composition des comptes actifs." slices={roles} centerLabel="comptes" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RankedTable
          soft
          title="Top bailleurs"
          subtitle="Par nombre de maisons, avec les loyers encaissés."
          icon={<Trophy size={16} />}
          empty="Aucun bailleur pour le moment."
          rows={topBailleurs.map((b) => ({
            id: b.idBailleur,
            nom: b.nomComplet,
            detail: `${b.nbMaisons} maison${b.nbMaisons > 1 ? "s" : ""}`,
            valeur: formatMontant(b.loyersEncaisses),
            part: totalLoyersBailleurs > 0 ? b.loyersEncaisses / totalLoyersBailleurs : 0,
          }))}
        />

        <SoftCard
          title="Biens et services par catégorie"
          subtitle={
            categories.length > CATEGORIES_VISIBLES
              ? `Les ${CATEGORIES_VISIBLES} plus fournies sur ${categories.length}. Disponibilité et taux d'occupation.`
              : "Disponibilité et taux d'occupation."
          }
          icon={<Package size={16} />}
          className="h-full"
        >
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun bien ou service.</p>
          ) : (
            <>
              <ListeCategories categories={categories.slice(0, CATEGORIES_VISIBLES)} />
              {categories.length > CATEGORIES_VISIBLES && (
                <button
                  type="button"
                  onClick={() => setCategoriesOuvert(true)}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
                >
                  Voir toutes les catégories ({categories.length})
                  <ArrowRight size={12} aria-hidden="true" />
                </button>
              )}
              <Modal isOpen={categoriesOuvert} onClose={() => setCategoriesOuvert(false)} title="Toutes les catégories" size="lg" titleTone="indigo">
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
                <div className="max-h-[60vh] overflow-y-auto pr-1">
                  {categories.filter((c) => c.categorie.toLowerCase().includes(rechercheCategorie.trim().toLowerCase())).length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">Aucun résultat.</p>
                  ) : (
                    <ListeCategories categories={categories.filter((c) => c.categorie.toLowerCase().includes(rechercheCategorie.trim().toLowerCase()))} />
                  )}
                </div>
              </Modal>
            </>
          )}
        </SoftCard>
      </div>
    </div>
  );
}
