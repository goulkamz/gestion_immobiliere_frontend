import { useMemo, useState } from "react";
import { AlertTriangle, Calendar } from "lucide-react";
import {
  DataTable,
  EmptyState,
  PageHeader,
  SearchInput,
  StatutBadge,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useClientEcheancesStatsQuery } from "@/hooks/queries/useStatsClient";
import { useParametresPubliquesQuery } from "@/hooks/queries/usePublicCatalog";
import { formatDate, formatMontant } from "@/utils/format";
import { getParametreEntier } from "@/utils/parametres";
import type { ClientEcheanceDTO } from "@/api/types";

export function ClientEcheancesPage() {
  const [search, setSearch] = useState("");
  const echeancesQuery = useClientEcheancesStatsQuery();
  const parametresQuery = useParametresPubliquesQuery();
  const toleranceJours = getParametreEntier(
    parametresQuery.data,
    "TOLERANCE_LOCATION_JOURS",
    4,
  );

  const filtered = useMemo(() => {
    const list = echeancesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((e) =>
      (e.moisLibelle ?? "").toLowerCase().includes(term),
    );
  }, [echeancesQuery.data, search]);

  const hasEnRetard = (echeancesQuery.data ?? []).some(
    (e) => e.statut === "EN_RETARD",
  );

  const columns: DataTableColumn<ClientEcheanceDTO>[] = [
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
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Mes échéances"
        description="Le suivi de vos échéances de loyer."
      />
      {echeancesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos échéances"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          {hasEnRetard && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-700">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>
                <span className="font-semibold">
                  Attention aux pénalités de retard :
                </span>{" "}
                vous disposez de {toleranceJours} jour
                {toleranceJours > 1 ? "s" : ""} après la date d&apos;échéance
                pour régler votre loyer. Passé ce délai, une pénalité est
                automatiquement ajoutée au montant dû. Payez avant cette limite
                pour l&apos;éviter.
              </p>
            </div>
          )}
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une période…"
              ariaLabel="Rechercher parmi mes échéances"
            />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(e) => e.idEcheance}
            loading={echeancesQuery.isLoading}
            emptyMessage={
              search
                ? "Aucune échéance ne correspond à votre recherche"
                : "Aucune échéance pour le moment"
            }
          />
        </>
      )}
    </div>
  );
}
