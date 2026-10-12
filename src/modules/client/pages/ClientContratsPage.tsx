import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AxiosResponse } from "axios";
import {
  AlertTriangle,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Files,
  Home,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  ActionGroup,
  DataTable,
  DocumentPreviewModal,
  EmptyState,
  Modal,
  PageHeader,
  SearchInput,
  StatutBadge,
  MaisonDetailModal,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useContratsLocationQuery } from "@/hooks/queries/useContrats";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { useClientUiStore } from "@/store/clientUiStore";
import { documentsApi } from "@/api/documents";
import { formatDate, formatMontant } from "@/utils/format";
import type { ContratLocationResponse } from "@/api/types";

const SORTIE_DISPONIBLE: ContratLocationResponse["statut"][] = [
  "TERMINE",
  "RESILIE",
];

interface DocumentDescriptor {
  key: string;
  label: string;
  icon: ReactNode;
  fetcher: () => Promise<AxiosResponse<Blob>>;
  filename: string;
}

export function ClientContratsPage() {
  const [detailMaison, setDetailMaison] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [openContrat, setOpenContrat] =
    useState<ContratLocationResponse | null>(null);
  const sidebarCollapsed = useClientUiStore((s) => s.sidebarCollapsed);
  const contratsQuery = useContratsLocationQuery({ size: 50 });
  const {
    openPreview,
    download,
    downloadPreview,
    closePreview,
    preview,
    isPending,
  } = useDocumentDownload();

  const filtered = useMemo(() => {
    const list = contratsQuery.data?.content ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((c) => c.nomCommunMaison.toLowerCase().includes(term));
  }, [contratsQuery.data, search]);

  function documentsFor(c: ContratLocationResponse): DocumentDescriptor[] {
    return [
      {
        key: `attestation-${c.idContratLocation}`,
        label: "Attestation de loyer",
        icon: (
          <FileCheck2
            size={16}
            className="text-primary-600"
            aria-hidden="true"
          />
        ),
        fetcher: () => documentsApi.attestationLoyer(c.idContratLocation),
        filename: `attestation-loyer-${c.idContratLocation}.pdf`,
      },
      {
        key: `contrat-${c.idContratLocation}`,
        label: "Contrat de location",
        icon: (
          <FileText size={16} className="text-primary-600" aria-hidden="true" />
        ),
        fetcher: () => documentsApi.contratLocation(c.idContratLocation),
        filename: `contrat-location-${c.idContratLocation}.pdf`,
      },
      {
        key: `edl-entree-${c.idContratLocation}`,
        label: "État des lieux (entrée)",
        icon: (
          <LogIn size={16} className="text-primary-600" aria-hidden="true" />
        ),
        fetcher: () => documentsApi.etatDesLieux(c.idContratLocation, "entree"),
        filename: `etat-des-lieux-entree-${c.idContratLocation}.pdf`,
      },
      ...(SORTIE_DISPONIBLE.includes(c.statut)
        ? [
            {
              key: `edl-sortie-${c.idContratLocation}`,
              label: "État des lieux (sortie)",
              icon: (
                <LogOut
                  size={16}
                  className="text-primary-600"
                  aria-hidden="true"
                />
              ),
              fetcher: () =>
                documentsApi.etatDesLieux(c.idContratLocation, "sortie"),
              filename: `etat-des-lieux-sortie-${c.idContratLocation}.pdf`,
            },
          ]
        : []),
    ];
  }

  const columns: DataTableColumn<ContratLocationResponse>[] = [
    {
      key: "maison",
      header: "Maison",
      render: (c) => (
        <span className="flex items-center gap-2">
          <Home
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {c.nomCommunMaison}
        </span>
      ),
    },
    {
      key: "dateEntree",
      header: "Entrée",
      render: (c) => formatDate(c.dateEntree),
    },
    {
      key: "dateSortie",
      header: "Sortie",
      render: (c) => formatDate(c.dateSortie),
    },
    {
      key: "loyer",
      header: "Loyer",
      align: "right",
      render: (c) => formatMontant(c.montantLoyer),
    },
    {
      key: "statut",
      header: "Statut",
      render: (c) => <StatutBadge statut={c.statut} />,
    },
    {
      key: "documents",
      header: "Actions",
      align: "right",
      render: (c) => {
        // Sidebar dépliée : un seul bouton "Documents". Sidebar repliée = plus d'espace :
        // un icône par document, avec son icône "aperçu" juste à côté.
        if (!sidebarCollapsed) {
          const items: ActionGroupItem[] = [
            {
              label: "Documents du contrat",
              text: "Documents",
              icon: <Files size={15} aria-hidden="true" />,
              onClick: () => setOpenContrat(c),
            },
          ];
          return (
            <ActionGroup
              items={[
                {
                  label: "Voir le détail",
                  text: "Détails",
                  icon: <Eye size={15} aria-hidden="true" />,
                  onClick: () => setDetailMaison(c.idMaison),
                },
                ...items,
              ]}
            />
          );
        }
        return (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              title="Voir le détail"
              aria-label="Voir le détail de la maison"
              onClick={() => setDetailMaison(c.idMaison)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
            >
              <Eye size={16} aria-hidden="true" />
            </button>
            {documentsFor(c).map((doc) => (
              <div
                key={doc.key}
                title={doc.label}
                className="inline-flex items-center gap-0.5 rounded-lg border border-primary-100 bg-primary-50/60 p-0.5"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center"
                  aria-hidden="true"
                >
                  {doc.icon}
                </span>
                <button
                  type="button"
                  aria-label={`Aperçu - ${doc.label}`}
                  disabled={isPending(doc.key)}
                  onClick={() =>
                    openPreview(doc.key, doc.fetcher, doc.label, doc.filename)
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-md text-primary-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eye size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <MaisonDetailModal
        idMaison={detailMaison}
        onClose={() => setDetailMaison(null)}
      />
      <PageHeader
        tone="indigo"
        title="Mes contrats"
        description="Vos contrats de location et documents associés."
      />
      {contratsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos contrats"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une maison…"
              ariaLabel="Rechercher parmi mes contrats"
            />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(c) => c.idContratLocation}
            loading={contratsQuery.isLoading}
            emptyMessage={
              search
                ? "Aucun contrat ne correspond à votre recherche"
                : "Aucun contrat de location pour le moment"
            }
          />
        </>
      )}

      <Modal
        isOpen={openContrat !== null}
        onClose={() => setOpenContrat(null)}
        title={
          openContrat
            ? `Documents - ${openContrat.nomCommunMaison}`
            : "Documents"
        }
      >
        {openContrat && (
          <ul className="divide-y divide-slate-100">
            {documentsFor(openContrat).map((doc) => (
              <li
                key={doc.key}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  {doc.icon}
                  {doc.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="Aperçu"
                    aria-label={`Aperçu - ${doc.label}`}
                    disabled={isPending(doc.key)}
                    onClick={() =>
                      openPreview(doc.key, doc.fetcher, doc.label, doc.filename)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Eye size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Télécharger"
                    aria-label={`Télécharger - ${doc.label}`}
                    disabled={isPending(doc.key)}
                    onClick={() => download(doc.key, doc.fetcher, doc.filename)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

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
