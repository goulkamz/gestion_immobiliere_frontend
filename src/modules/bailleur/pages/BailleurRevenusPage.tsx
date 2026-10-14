import { useState } from "react";
import { AlertTriangle, Building2, Calendar } from "lucide-react";
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
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { formatDate, formatMontant } from "@/utils/format";
import { moisOccupation } from "@/utils/mandat";
import type { EcheanceResponse } from "@/api/types";

const STATUTS = ["EN_ATTENTE", "PAYE", "EN_RETARD"] as const;

interface RevenuRow extends EcheanceResponse {
  loyersDus: number;
}

// Loyers dus = net reversé + commission de l'agence (même calcul que côté agent).
const versRows = (list: EcheanceResponse[] | undefined): RevenuRow[] =>
  (list ?? []).map((e) => ({
    ...e,
    loyersDus: e.montantDu + (e.commissionDeduite ?? 0),
  }));

export function BailleurRevenusPage() {
  const {
    search,
    setSearch,
    recherche,
    page: pageMensuel,
    setPage: setPageMensuel,
  } = useRechercheServeur();
  const [pageCumul, setPageCumul] = useState(0);
  const [courFilter, setCourFilter] = useState("");

  // Périmètre (mes mandats), recherche, cour, mode et pagination sont appliqués côté serveur
  const filtres = {
    type: "MANDAT" as const,
    recherche: recherche || undefined,
    referenceCour: courFilter || undefined,
  };
  const params = { ...filtres, size: 20, sort: "dateEcheance,desc" };
  const mensuelsQuery = useEcheancesQuery({
    ...params,
    page: pageMensuel,
    modeFacturation: "MENSUEL",
  });
  const cumulsQuery = useEcheancesQuery({
    ...params,
    page: pageCumul,
    modeFacturation: "CUMUL",
  });
  const compteurs = useCompteursStatut(useEcheancesQuery, filtres, STATUTS);
  const coursQuery = useCoursQuery({ size: 100 });

  const cours = coursQuery.data?.content ?? [];
  const mensuels = versRows(mensuelsQuery.data?.content);
  const cumules = versRows(cumulsQuery.data?.content);
  const echeancesQuery = mensuelsQuery;

  function changerCour(valeur: string) {
    setCourFilter(valeur);
    setPageMensuel(0);
    setPageCumul(0);
  }

  const columns: DataTableColumn<RevenuRow>[] = [
    {
      key: "echeance",
      header: "Échéance",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Calendar
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {formatDate(e.dateEcheance)}
        </span>
      ),
    },
    {
      key: "occupation",
      header: "Occupation",
      render: (e) => moisOccupation(e.dateEcheance),
    },
    ...(cours.length > 1
      ? [
          {
            key: "cour",
            header: "Cour",
            render: (e: RevenuRow) => (
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
      key: "loyers",
      header: "Loyers dus",
      align: "right",
      render: (e) => formatMontant(e.loyersDus),
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      render: (e) => formatMontant(e.commissionDeduite),
    },
    {
      key: "du",
      header: "Net à vous reverser",
      align: "right",
      render: (e) => formatMontant(e.montantDu),
    },
    {
      key: "recu",
      header: "Virement reçu",
      align: "right",
      render: (e) => formatMontant(e.montantPaye),
    },
    {
      key: "statut",
      header: "Statut du virement",
      render: (e) => <StatutBadge statut={e.statut} />,
    },
  ];

  const vide =
    search || courFilter
      ? "Aucune période ne correspond à votre recherche"
      : "Aucun revenu pour le moment";

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Mes revenus"
        description="Ce que l'agence vous reverse : les loyers dus de la cour, moins sa commission. Une échéance du 1er d'un mois correspond à l'occupation du mois précédent."
      />

      <CompteursStatut
        compteurs={compteurs}
        statuts={STATUTS}
        labels={{ PAYE: "Versé" }}
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
                  onChange={(e) => changerCour(e.target.value)}
                  placeholder="Toutes les cours"
                  options={cours.map((c) => ({
                    value: c.referenceCour,
                    label: c.referenceCour,
                  }))}
                />
              </div>
            )}
            <div className="sm:w-64">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une période…"
                ariaLabel="Rechercher parmi mes revenus"
              />
            </div>
          </div>

          <section className="mb-8">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Versements mensuels
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Un reversement par mois pour les mandats en versement mensuel.
            </p>
            <DataTable
              data={mensuels}
              columns={columns}
              keyExtractor={(e) => e.idEcheance}
              loading={mensuelsQuery.isLoading}
              emptyMessage={vide}
            />
            {mensuelsQuery.data && (
              <Pagination
                currentPage={mensuelsQuery.data.page.number}
                totalPages={mensuelsQuery.data.page.totalPages}
                totalElements={mensuelsQuery.data.page.totalElements}
                onPageChange={setPageMensuel}
              />
            )}
          </section>

          {((cumulsQuery.data?.page.totalElements ?? 0) > 0 ||
            search ||
            courFilter) && (
            <section>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Versements cumulés
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Pour les mandats en versement cumulé, l'agence vous verse
                plusieurs mois d'un coup. Le détail de chaque mois et le statut
                de son virement sont indiqués ici.
              </p>
              <DataTable
                data={cumules}
                columns={columns}
                keyExtractor={(e) => e.idEcheance}
                loading={cumulsQuery.isLoading}
                emptyMessage="Aucun cumul calculé pour le moment"
              />
              {cumulsQuery.data && (
                <Pagination
                  currentPage={cumulsQuery.data.page.number}
                  totalPages={cumulsQuery.data.page.totalPages}
                  totalElements={cumulsQuery.data.page.totalElements}
                  onPageChange={setPageCumul}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
