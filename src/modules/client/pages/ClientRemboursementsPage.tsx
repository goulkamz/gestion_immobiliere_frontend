import { useCible } from "@/hooks/useLigneCiblee";
import { AlertTriangle, Calendar, Undo2 } from "lucide-react";
import { DataTable, EmptyState, PageHeader } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useClientRemboursementsStatsQuery } from "@/hooks/queries/useStatsClient";
import { formatDate, formatMontant } from "@/utils/format";
import type { ClientRemboursementDTO } from "@/api/types";

export function ClientRemboursementsPage() {
  const remboursementsQuery = useClientRemboursementsStatsQuery();
  const { cibleId, effacer: effacerCible } = useCible();

  const columns: DataTableColumn<ClientRemboursementDTO>[] = [
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="flex items-center gap-2">
          <Calendar size={15} className="shrink-0 text-success-600" aria-hidden="true" />
          {formatDate(r.dateRemboursement)}
        </span>
      ),
    },
    { key: "motif", header: "Motif", render: (r) => r.motif ?? "-" },
    {
      key: "montant",
      header: "Montant",
      align: "right",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-success-700">
          <Undo2 size={14} aria-hidden="true" />
          {formatMontant(r.montant)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader tone="indigo" title="Mes remboursements" description="Historique des remboursements effectués par l'agence." />
      {remboursementsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos remboursements"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <DataTable
          data={remboursementsQuery.data ?? []}
          highlightKey={cibleId}
          onDismissHighlight={effacerCible}
          columns={columns}
          keyExtractor={(r) => r.idRemboursement}
          loading={remboursementsQuery.isLoading}
          emptyMessage="Aucun remboursement pour le moment"
        />
      )}
    </div>
  );
}
