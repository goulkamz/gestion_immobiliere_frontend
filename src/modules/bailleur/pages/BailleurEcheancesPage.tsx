import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  Home,
  User,
} from "lucide-react";
import {
  CompteursStatut,
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatutBadge,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useEcheancesQuery } from "@/hooks/queries/useEcheances";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { documentsApi } from "@/api/documents";
import { statutLabel } from "@/utils/statut";
import { formatDate, formatMontant } from "@/utils/format";
import type { EcheanceResponse, StatutEcheance } from "@/api/types";

const STATUTS = ["EN_ATTENTE", "PAYE", "EN_RETARD"] as const;

export function BailleurEcheancesPage() {
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [courFilter, setCourFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutEcheance | "">("");

  // Périmètre (mes contrats), recherche, cour, statut et pagination sont appliqués côté serveur
  const filtres = {
    type: "LOCATION" as const,
    recherche: recherche || undefined,
    referenceCour: courFilter || undefined,
  };
  const echeancesQuery = useEcheancesQuery({
    ...filtres,
    page,
    size: 20,
    sort: "dateEcheance,desc",
    statut: statutFilter || undefined,
  });
  const compteurs = useCompteursStatut(useEcheancesQuery, filtres, STATUTS);
  const coursQuery = useCoursQuery({ size: 100 });
  const { download, isPending } = useDocumentDownload();

  const cours = coursQuery.data?.content ?? [];
  const echeances = echeancesQuery.data?.content ?? [];

  const columns: DataTableColumn<EcheanceResponse>[] = [
    {
      key: "periode",
      header: "Période",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Calendar
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {e.moisLibelle ?? formatDate(e.dateEcheance)}
        </span>
      ),
    },
    {
      key: "maison",
      header: "Maison",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Home
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {e.nomCommunMaison ?? "-"}
        </span>
      ),
    },
    {
      key: "locataire",
      header: "Locataire",
      render: (e) => (
        <span className="flex items-center gap-2">
          <User
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {e.nomLocataire ?? "-"}
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
                <Building2
                  size={15}
                  className="shrink-0 text-primary-600"
                  aria-hidden="true"
                />
                {e.referenceCour ?? "-"}
              </span>
            ),
          },
        ]
      : []),
    {
      key: "echeance",
      header: "Échéance",
      render: (e) => formatDate(e.dateEcheance),
    },
    {
      key: "du",
      header: "Dû",
      align: "right",
      render: (e) => formatMontant(e.montantDu),
    },
    {
      key: "paye",
      header: "Payé",
      align: "right",
      render: (e) => formatMontant(e.montantPaye),
    },
    {
      key: "statut",
      header: "Statut",
      render: (e) => <StatutBadge statut={e.statut} />,
    },
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
            onClick={() =>
              download(
                `quittance-${e.idEcheance}`,
                () => documentsApi.quittance(e.idEcheance),
                `quittance-${e.idEcheance}.pdf`,
              )
            }
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

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} />
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
                  onChange={(e) => {
                    setCourFilter(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Toutes les cours"
                  options={cours.map((c) => ({
                    value: c.referenceCour,
                    label: c.referenceCour,
                  }))}
                />
              </div>
            )}
            <div className="sm:w-44">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutEcheance | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((st) => ({
                  value: st,
                  label: statutLabel(st),
                }))}
              />
            </div>
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
            data={echeances}
            columns={columns}
            keyExtractor={(e) => e.idEcheance}
            loading={echeancesQuery.isLoading}
            emptyMessage={
              search || courFilter || statutFilter
                ? "Aucune échéance ne correspond à votre recherche"
                : "Aucune échéance pour le moment"
            }
          />
          {echeancesQuery.data && (
            <Pagination
              currentPage={echeancesQuery.data.page.number}
              totalPages={echeancesQuery.data.page.totalPages}
              totalElements={echeancesQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
