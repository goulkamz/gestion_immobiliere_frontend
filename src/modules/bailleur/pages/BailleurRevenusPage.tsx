import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Calendar } from "lucide-react";
import { DataTable, EmptyState, PageHeader, SearchInput, Select, StatutBadge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useEcheancesQuery } from "@/hooks/queries/useEcheances";
import { useContratsLocationQuery } from "@/hooks/queries/useContrats";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useQueries } from "@tanstack/react-query";
import { maisonsQueryKeys } from "@/hooks/queries/useMaisons";
import { maisonsApi } from "@/api/maisons";
import { formatDate, formatMontant } from "@/utils/format";
import type { EcheanceResponse } from "@/api/types";

interface RevenuRow extends EcheanceResponse {
  referenceCour?: string;
  loyersDuMois: number | null;
}

export function BailleurRevenusPage() {
  const [search, setSearch] = useState("");
  const [courFilter, setCourFilter] = useState("");

  // Pas de filtre `type` ici : on a besoin des deux (MANDAT pour la liste, LOCATION pour
  // le rapprochement "Loyers du mois"), on sépare nous-mêmes via `e.type` ci-dessous.
  const echeancesQuery = useEcheancesQuery({ size: 100 });
  const contratsLocationQuery = useContratsLocationQuery({ size: 100 });
  const mandatsQuery = useContratsMandatQuery({ size: 100 });
  const coursQuery = useCoursQuery({ size: 100 });

  const cours = useMemo(() => coursQuery.data?.content ?? [], [coursQuery.data]);
  const maisonsQueries = useQueries({
    queries: cours.map((cour) => ({
      queryKey: maisonsQueryKeys.list({ idCour: cour.idCour, size: 100 }),
      queryFn: () => maisonsApi.list({ idCour: cour.idCour, size: 100 }),
      enabled: cours.length > 0,
    })),
  });

  const maisonCourMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const q of maisonsQueries) for (const m of q.data?.content ?? []) map.set(m.idMaison, m.referenceCour);
    return map;
  }, [maisonsQueries]);

  // Les échéances mandat n'exposent que entiteId (idMandat) : on retrouve la cour via les mandats.
  const mandatCourMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of mandatsQuery.data?.content ?? []) map.set(m.idMandat, m.referenceCour);
    return map;
  }, [mandatsQuery.data]);

  // Pour vérifier le reversement : cour d'un contrat de location, via sa maison.
  const contratLocationCourMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of contratsLocationQuery.data?.content ?? []) {
      const ref = maisonCourMap.get(c.idMaison);
      if (ref) map.set(c.idContratLocation, ref);
    }
    return map;
  }, [contratsLocationQuery.data, maisonCourMap]);

  const mandatEcheances = useMemo(() => (echeancesQuery.data?.content ?? []).filter((e) => e.type === "MANDAT"), [echeancesQuery.data]);
  const locationEcheances = useMemo(() => (echeancesQuery.data?.content ?? []).filter((e) => e.type === "LOCATION"), [echeancesQuery.data]);

  // Pour une cour et un mois donnés, la somme des loyers locataires dus ce mois-là —
  // sert de repère pour vérifier le montant net reversé (loyers moins commission).
  const rows: RevenuRow[] = useMemo(() => {
    return mandatEcheances.map((e) => {
      const referenceCour = mandatCourMap.get(e.entiteId);
      const mois = e.dateEcheance.slice(0, 7);
      const loyersMatches = locationEcheances.filter(
        (loc) => contratLocationCourMap.get(loc.entiteId) === referenceCour && loc.dateEcheance.slice(0, 7) === mois,
      );
      const loyersDuMois = referenceCour && loyersMatches.length > 0 ? loyersMatches.reduce((sum, l) => sum + l.montantDu, 0) : null;
      return { ...e, referenceCour, loyersDuMois };
    });
  }, [mandatEcheances, mandatCourMap, locationEcheances, contratLocationCourMap]);

  const filtered = useMemo(() => {
    let list = rows;
    if (courFilter) list = list.filter((e) => e.referenceCour === courFilter);
    const term = search.trim().toLowerCase();
    if (term) list = list.filter((e) => (e.moisLibelle ?? "").toLowerCase().includes(term));
    return [...list].sort((a, b) => b.dateEcheance.localeCompare(a.dateEcheance));
  }, [rows, courFilter, search]);

  const columns: DataTableColumn<RevenuRow>[] = [
    {
      key: "periode",
      header: "Période",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Calendar size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {e.moisLibelle ?? formatDate(e.dateEcheance)}
        </span>
      ),
    },
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
    { key: "loyers", header: "Loyers du mois", align: "right", render: (e) => formatMontant(e.loyersDuMois) },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      render: (e) => (e.loyersDuMois !== null ? formatMontant(e.loyersDuMois - e.montantDu) : "-"),
    },
    { key: "du", header: "Montant dû (net)", align: "right", render: (e) => formatMontant(e.montantDu) },
    { key: "recu", header: "Montant reçu", align: "right", render: (e) => formatMontant(e.montantPaye) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Mes revenus"
        description="Le montant net que l'agence vous reverse chaque mois : le total des loyers de la cour ce mois-là, moins sa commission."
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
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(e) => e.idEcheance}
            loading={echeancesQuery.isLoading || contratsLocationQuery.isLoading || mandatsQuery.isLoading}
            emptyMessage={search || courFilter ? "Aucune période ne correspond à votre recherche" : "Aucun revenu pour le moment"}
          />
        </>
      )}
    </div>
  );
}
