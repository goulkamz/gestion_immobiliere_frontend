import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Calendar } from "lucide-react";
import { DataTable, EmptyState, PageHeader, SearchInput, Select, StatutBadge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useEcheancesQuery } from "@/hooks/queries/useEcheances";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { formatDate, formatMontant } from "@/utils/format";
import { moisOccupation } from "@/utils/mandat";
import type { EcheanceResponse, ModeFacturation } from "@/api/types";

interface RevenuRow extends EcheanceResponse {
  referenceCour?: string;
  mode: ModeFacturation | null;
  loyersDus: number;
}

export function BailleurRevenusPage() {
  const [search, setSearch] = useState("");
  const [courFilter, setCourFilter] = useState("");

  const echeancesQuery = useEcheancesQuery({ type: "MANDAT", size: 100, sort: "dateEcheance,desc" });
  const mandatsQuery = useContratsMandatQuery({ size: 100 });
  const coursQuery = useCoursQuery({ size: 100 });

  const cours = useMemo(() => coursQuery.data?.content ?? [], [coursQuery.data]);

  // Les échéances mandat n'exposent que entiteId (idMandat) : on retrouve la cour et le mode via les mandats.
  const mandatMap = useMemo(() => {
    const map = new Map<number, { referenceCour: string; mode: ModeFacturation | null }>();
    for (const m of mandatsQuery.data?.content ?? []) map.set(m.idMandat, { referenceCour: m.referenceCour, mode: m.modeFacturation });
    return map;
  }, [mandatsQuery.data]);

  // Loyers dus = net reversé + commission de l'agence (même calcul que côté agent).
  const rows: RevenuRow[] = useMemo(
    () =>
      (echeancesQuery.data?.content ?? [])
        .filter((e) => e.type === "MANDAT")
        .map((e) => {
          const mandat = mandatMap.get(e.entiteId);
          return { ...e, referenceCour: mandat?.referenceCour, mode: mandat?.mode ?? null, loyersDus: e.montantDu + (e.commissionDeduite ?? 0) };
        }),
    [echeancesQuery.data, mandatMap],
  );

  const filtered = useMemo(() => {
    let list = rows;
    if (courFilter) list = list.filter((e) => e.referenceCour === courFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (e) => (e.moisLibelle ?? "").toLowerCase().includes(term) || moisOccupation(e.dateEcheance).toLowerCase().includes(term),
      );
    }
    return [...list].sort((a, b) => b.dateEcheance.localeCompare(a.dateEcheance));
  }, [rows, courFilter, search]);

  const cumules = useMemo(() => filtered.filter((e) => e.mode === "CUMUL"), [filtered]);
  const mensuels = useMemo(() => filtered.filter((e) => e.mode !== "CUMUL"), [filtered]);

  const columns: DataTableColumn<RevenuRow>[] = [
    {
      key: "echeance",
      header: "Échéance",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Calendar size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {formatDate(e.dateEcheance)}
        </span>
      ),
    },
    { key: "occupation", header: "Occupation", render: (e) => moisOccupation(e.dateEcheance) },
    ...(cours.length > 1
      ? [
          {
            key: "cour",
            header: "Cour",
            render: (e: RevenuRow) => (
              <span className="flex items-center gap-2">
                <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
                {e.referenceCour ?? "-"}
              </span>
            ),
          },
        ]
      : []),
    { key: "loyers", header: "Loyers dus", align: "right", render: (e) => formatMontant(e.loyersDus) },
    { key: "commission", header: "Commission", align: "right", render: (e) => formatMontant(e.commissionDeduite) },
    { key: "du", header: "Net à vous reverser", align: "right", render: (e) => formatMontant(e.montantDu) },
    { key: "recu", header: "Virement reçu", align: "right", render: (e) => formatMontant(e.montantPaye) },
    { key: "statut", header: "Statut du virement", render: (e) => <StatutBadge statut={e.statut} /> },
  ];

  const vide = search || courFilter ? "Aucune période ne correspond à votre recherche" : "Aucun revenu pour le moment";

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Mes revenus"
        description="Ce que l'agence vous reverse : les loyers dus de la cour, moins sa commission. Une échéance du 1er d'un mois correspond à l'occupation du mois précédent."
      />
      {echeancesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos revenus"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {cours.length > 1 && (
              <div className="sm:w-48">
                <Select
                  aria-label="Filtrer par cour"
                  value={courFilter}
                  onChange={(e) => setCourFilter(e.target.value)}
                  placeholder="Toutes les cours"
                  options={cours.map((c) => ({ value: c.referenceCour, label: c.referenceCour }))}
                />
              </div>
            )}
            <div className="sm:w-64">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une période…" ariaLabel="Rechercher parmi mes revenus" />
            </div>
          </div>

          <section className="mb-8">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Versements mensuels</h2>
            <p className="mb-3 text-xs text-slate-500">Un reversement par mois pour les mandats en versement mensuel.</p>
            <DataTable
              data={mensuels}
              columns={columns}
              keyExtractor={(e) => e.idEcheance}
              loading={echeancesQuery.isLoading || mandatsQuery.isLoading}
              emptyMessage={vide}
            />
          </section>

          {(cumules.length > 0 || [...mandatMap.values()].some((m) => m.mode === "CUMUL")) && (
            <section>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Versements cumulés</h2>
              <p className="mb-3 text-xs text-slate-500">
                Pour les mandats en versement cumulé, l'agence vous verse plusieurs mois d'un coup. Le détail de chaque mois et le statut de son
                virement sont indiqués ici.
              </p>
              <DataTable
                data={cumules}
                columns={columns}
                keyExtractor={(e) => e.idEcheance}
                loading={echeancesQuery.isLoading || mandatsQuery.isLoading}
                emptyMessage="Aucun cumul calculé pour le moment"
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
