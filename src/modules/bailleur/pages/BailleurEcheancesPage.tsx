import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, Building2, Calendar, Download, Home, User } from "lucide-react";
import { DataTable, EmptyState, PageHeader, SearchInput, Select, StatutBadge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useEcheancesQuery } from "@/hooks/queries/useEcheances";
import { useContratsLocationQuery } from "@/hooks/queries/useContrats";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { maisonsQueryKeys } from "@/hooks/queries/useMaisons";
import { maisonsApi } from "@/api/maisons";
import { documentsApi } from "@/api/documents";
import { formatDate, formatMontant } from "@/utils/format";
import type { EcheanceResponse } from "@/api/types";

interface ContratInfo {
  referenceCour: string;
  nomLocataire: string;
  nomCommunMaison: string;
}

export function BailleurEcheancesPage() {
  const [search, setSearch] = useState("");
  const [courFilter, setCourFilter] = useState("");

  // `type: "LOCATION"` filtre déjà côté serveur ; le filtre sur `e.type` ci-dessous est
  // gardé en secours (défense en profondeur, coût négligeable).
  const echeancesQuery = useEcheancesQuery({ type: "LOCATION", size: 100 });
  const contratsLocationQuery = useContratsLocationQuery({ size: 100 });
  const coursQuery = useCoursQuery({ size: 100 });
  const { download, isPending } = useDocumentDownload();

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

  // Les échéances n'exposent que entiteId (idContratLocation) : on reconstruit la cour, le
  // locataire et la maison via le contrat, pour les afficher et permettre le filtre multi-cours.
  const contratInfoMap = useMemo(() => {
    const map = new Map<number, ContratInfo>();
    for (const c of contratsLocationQuery.data?.content ?? []) {
      const referenceCour = maisonCourMap.get(c.idMaison);
      if (referenceCour) map.set(c.idContratLocation, { referenceCour, nomLocataire: c.nomLocataire, nomCommunMaison: c.nomCommunMaison });
    }
    return map;
  }, [contratsLocationQuery.data, maisonCourMap]);

  const locationEcheances = useMemo(() => (echeancesQuery.data?.content ?? []).filter((e) => e.type === "LOCATION"), [echeancesQuery.data]);

  const filtered = useMemo(() => {
    let list = locationEcheances;
    if (courFilter) list = list.filter((e) => contratInfoMap.get(e.entiteId)?.referenceCour === courFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((e) => {
        const info = contratInfoMap.get(e.entiteId);
        return (
          (e.moisLibelle ?? "").toLowerCase().includes(term) ||
          (info?.nomLocataire ?? "").toLowerCase().includes(term) ||
          (info?.nomCommunMaison ?? "").toLowerCase().includes(term)
        );
      });
    }
    return list;
  }, [locationEcheances, courFilter, search, contratInfoMap]);

  const columns: DataTableColumn<EcheanceResponse>[] = [
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
    {
      key: "maison",
      header: "Maison",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Home size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {contratInfoMap.get(e.entiteId)?.nomCommunMaison ?? "-"}
        </span>
      ),
    },
    {
      key: "locataire",
      header: "Locataire",
      render: (e) => (
        <span className="flex items-center gap-2">
          <User size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {contratInfoMap.get(e.entiteId)?.nomLocataire ?? "-"}
        </span>
      ),
    },
    ...(cours.length > 1
      ? [
          {
            key: "cour",
            header: "Cour",
            render: (e: EcheanceResponse) => (
              <span className="flex items-center gap-2">
                <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
                {contratInfoMap.get(e.entiteId)?.referenceCour ?? "-"}
              </span>
            ),
          },
        ]
      : []),
    { key: "echeance", header: "Échéance", render: (e) => formatDate(e.dateEcheance) },
    { key: "du", header: "Dû", align: "right", render: (e) => formatMontant(e.montantDu) },
    { key: "paye", header: "Payé", align: "right", render: (e) => formatMontant(e.montantPaye) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (e) =>
        e.statut === "PAYE" ? (
          <button
            type="button"
            title="Télécharger la quittance"
            aria-label={`Télécharger la quittance - ${e.moisLibelle ?? formatDate(e.dateEcheance)}`}
            disabled={isPending(`quittance-${e.idEcheance}`)}
            onClick={() => download(`quittance-${e.idEcheance}`, () => documentsApi.quittance(e.idEcheance), `quittance-${e.idEcheance}.pdf`)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden="true" />
          </button>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Les échéances de mes locataires"
        description="Le suivi des loyers dus par vos locataires sur les maisons de votre patrimoine."
      />
      {echeancesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger ces échéances"
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
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une période, un locataire, une maison…"
                ariaLabel="Rechercher parmi ces échéances"
              />
            </div>
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(e) => e.idEcheance}
            loading={echeancesQuery.isLoading || contratsLocationQuery.isLoading}
            emptyMessage={search || courFilter ? "Aucune échéance ne correspond à votre recherche" : "Aucune échéance pour le moment"}
          />
        </>
      )}
    </div>
  );
}
