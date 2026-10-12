import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Download, Eye, FileSignature } from "lucide-react";
import { Badge, DataTable, DocumentPreviewModal, EmptyState, PageHeader, SearchInput, StatutBadge, CourDetailModalById } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { documentsApi } from "@/api/documents";
import { formatDate } from "@/utils/format";
import { MODE_FACTURATION_LABELS } from "@/utils/mandat";
import type { ContratMandatResponse } from "@/api/types";

const TYPE_LABELS: Record<ContratMandatResponse["typeMandat"], string> = {
  GESTION: "Gestion",
  LOCATION: "Location",
  VENTE: "Vente",
};

export function BailleurMandatsPage() {
  const [detailCour, setDetailCour] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const mandatsQuery = useContratsMandatQuery({ size: 50 });
  const { openPreview, download, closePreview, downloadPreview, preview, isPending } = useDocumentDownload();

  const filtered = useMemo(() => {
    const list = mandatsQuery.data?.content ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((m) => m.referenceCour.toLowerCase().includes(term) || m.nomAgent.toLowerCase().includes(term));
  }, [mandatsQuery.data, search]);

  const columns: DataTableColumn<ContratMandatResponse>[] = [
    {
      key: "cour",
      header: "Cour",
      render: (m) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {m.referenceCour}
        </span>
      ),
    },
    { key: "agent", header: "Agent en charge", render: (m) => m.nomAgent },
    { key: "type", header: "Type", render: (m) => <Badge>{TYPE_LABELS[m.typeMandat]}</Badge> },
    { key: "facturation", header: "Facturation", render: (m) => (m.modeFacturation ? MODE_FACTURATION_LABELS[m.modeFacturation] : "-") },
    { key: "commission", header: "Commission", align: "right", render: (m) => (m.commission !== null ? `${m.commission} %` : "-") },
    { key: "debut", header: "Début", render: (m) => formatDate(m.dateDebut) },
    { key: "fin", header: "Fin", render: (m) => formatDate(m.dateFin) },
    { key: "statut", header: "Statut", render: (m) => <StatutBadge statut={m.statut} /> },
    {
      key: "actions",
      header: "Contrat",
      align: "right",
      render: (m) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            title="Voir la cour"
            aria-label={`Voir le détail de la cour - ${m.referenceCour}`}
            onClick={() => setDetailCour(m.idCour)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
          >
            <Building2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Aperçu du contrat"
            aria-label={`Aperçu du contrat - ${m.referenceCour}`}
            disabled={isPending(`mandat-${m.idMandat}`)}
            onClick={() =>
              openPreview(`mandat-${m.idMandat}`, () => documentsApi.contratMandat(m.idMandat), "Contrat de mandat", `contrat-mandat-${m.idMandat}.pdf`)
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eye size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Télécharger le contrat"
            aria-label={`Télécharger le contrat - ${m.referenceCour}`}
            disabled={isPending(`mandat-${m.idMandat}`)}
            onClick={() => download(`mandat-${m.idMandat}`, () => documentsApi.contratMandat(m.idMandat), `contrat-mandat-${m.idMandat}.pdf`)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <CourDetailModalById idCour={detailCour} onClose={() => setDetailCour(null)} />
      <PageHeader tone="indigo" title="Mes mandats" description="Vos mandats de gestion, actifs et passés, cour par cour." />
      {mandatsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos mandats"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une cour ou un agent…" ariaLabel="Rechercher parmi mes mandats" />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(m) => m.idMandat}
            loading={mandatsQuery.isLoading}
            emptyMessage={
              search
                ? "Aucun mandat ne correspond à votre recherche"
                : "Aucun mandat de gestion pour le moment"
            }
          />
        </>
      )}

      {mandatsQuery.data?.content.length === 0 && !search && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <FileSignature size={15} aria-hidden="true" />
          Contactez l'agence pour établir un mandat de gestion sur votre patrimoine.
        </p>
      )}

      <DocumentPreviewModal
        isOpen={preview !== null}
        onClose={closePreview}
        title={preview?.title ?? ""}
        blob={preview?.blob ?? null}
        onDownload={downloadPreview}
      />
    </div>
  );
}
