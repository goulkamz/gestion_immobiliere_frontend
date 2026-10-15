import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  Download,
  Eye,
  FilePen,
  FileSignature,
} from "lucide-react";
import {
  Badge,
  CompteursStatut,
  DataTable,
  DocumentPreviewModal,
  EmptyState,
  PageHeader,
  Pagination,
  Select,
  SearchInput,
  StatutBadge,
  CourDetailModalById,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { AvenantsModal } from "@/components/ui/AvenantsModal";
import { useAvenantsMandatQuery, useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { statutLabel } from "@/utils/statut";
import { documentsApi } from "@/api/documents";
import { documentsAvenants } from "@/utils/avenants";
import { formatDate } from "@/utils/format";
import { MODE_FACTURATION_LABELS } from "@/utils/mandat";
import type { ContratMandatResponse, StatutMandat } from "@/api/types";

const STATUTS = ["EN_ATTENTE", "ACTIF", "RESILIE", "EXPIRE"] as const;

const TYPE_LABELS: Record<ContratMandatResponse["typeMandat"], string> = {
  GESTION: "Gestion",
  LOCATION: "Location",
  VENTE: "Vente",
};

export function BailleurMandatsPage() {
  const [detailCour, setDetailCour] = useState<number | null>(null);
  const [avenantsMandat, setAvenantsMandat] = useState<ContratMandatResponse | null>(null);
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<StatutMandat | "">("");
  // Périmètre (mes cours), recherche, statut et pagination sont appliqués côté serveur
  const mandatsQuery = useContratsMandatQuery({
    page,
    size: 20,
    statut: statutFilter || undefined,
    recherche: recherche || undefined,
  });
  const compteurs = useCompteursStatut(
    useContratsMandatQuery,
    { recherche: recherche || undefined },
    STATUTS,
  );
  const {
    openPreview,
    download,
    closePreview,
    downloadPreview,
    isPending,
    preview,
  } = useDocumentDownload();
  const avenantsQuery = useAvenantsMandatQuery(avenantsMandat?.idMandat ?? 0, { enabled: avenantsMandat !== null });
  const mandats = mandatsQuery.data?.content ?? [];

  const columns: DataTableColumn<ContratMandatResponse>[] = [
    {
      key: "cour",
      header: "Cour",
      render: (m) => (
        <span className="flex items-center gap-2">
          <Building2
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {m.referenceCour}
        </span>
      ),
    },
    { key: "agent", header: "Agent en charge", render: (m) => m.nomAgent },
    {
      key: "type",
      header: "Type",
      render: (m) => <Badge>{TYPE_LABELS[m.typeMandat]}</Badge>,
    },
    {
      key: "facturation",
      header: "Facturation",
      render: (m) =>
        m.modeFacturation ? MODE_FACTURATION_LABELS[m.modeFacturation] : "-",
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      render: (m) => (m.commission !== null ? `${m.commission} %` : "-"),
    },
    { key: "debut", header: "Début", render: (m) => formatDate(m.dateDebut) },
    { key: "fin", header: "Fin", render: (m) => formatDate(m.dateFin) },
    {
      key: "statut",
      header: "Statut",
      render: (m) => <StatutBadge statut={m.statut} />,
    },
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
              openPreview(
                `mandat-${m.idMandat}`,
                () => documentsApi.contratMandat(m.idMandat),
                "Contrat de mandat",
                `contrat-mandat-${m.idMandat}.pdf`,
              )
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
            onClick={() =>
              download(
                `mandat-${m.idMandat}`,
                () => documentsApi.contratMandat(m.idMandat),
                `contrat-mandat-${m.idMandat}.pdf`,
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Avenants du mandat"
            aria-label={`Avenants du mandat - ${m.referenceCour}`}
            onClick={() => setAvenantsMandat(m)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
          >
            <FilePen size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <CourDetailModalById
        idCour={detailCour}
        onClose={() => setDetailCour(null)}
      />
      <PageHeader
        tone="indigo"
        title="Mes mandats"
        description="Vos mandats de gestion, actifs et passés, cour par cour."
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} />
      {mandatsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos mandats"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-44">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutMandat | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((st) => ({
                  value: st,
                  label: statutLabel(st),
                }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une cour…"
                ariaLabel="Rechercher parmi mes mandats"
              />
            </div>
          </div>
          <DataTable
            data={mandats}
            columns={columns}
            keyExtractor={(m) => m.idMandat}
            loading={mandatsQuery.isLoading}
            emptyMessage={
              search || statutFilter
                ? "Aucun mandat ne correspond à votre recherche"
                : "Aucun mandat de gestion pour le moment"
            }
          />
          {mandatsQuery.data && (
            <Pagination
              currentPage={mandatsQuery.data.page.number}
              totalPages={mandatsQuery.data.page.totalPages}
              totalElements={mandatsQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {mandatsQuery.data?.content.length === 0 && !search && !statutFilter && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <FileSignature size={15} aria-hidden="true" />
          Contactez l'agence pour établir un mandat de gestion sur votre
          patrimoine.
        </p>
      )}

      <AvenantsModal
        isOpen={avenantsMandat !== null}
        onClose={() => setAvenantsMandat(null)}
        title={avenantsMandat ? `Avenants - ${avenantsMandat.referenceCour}` : "Avenants"}
        loading={avenantsQuery.isLoading}
        documents={documentsAvenants(avenantsQuery.data)}
        isPending={isPending}
        onPreview={(doc) => openPreview(doc.key, doc.fetcher, doc.label, doc.filename)}
        onDownload={(doc) => download(doc.key, doc.fetcher, doc.filename)}
      />

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
