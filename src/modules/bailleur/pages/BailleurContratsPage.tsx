import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AxiosResponse } from "axios";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, Building2, Download, Eye, FileCheck2, FileText, Files, Home, LogIn, LogOut, User } from "lucide-react";
import { ActionGroup, DataTable, DocumentPreviewModal, EmptyState, PageHeader, Modal, Select, SearchInput, StatutBadge, MaisonDetailModal } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useContratsLocationQuery } from "@/hooks/queries/useContrats";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { useBailleurUiStore } from "@/store/bailleurUiStore";
import { maisonsQueryKeys } from "@/hooks/queries/useMaisons";
import { maisonsApi } from "@/api/maisons";
import { documentsApi } from "@/api/documents";
import { formatDate, formatMontant } from "@/utils/format";
import type { ContratLocationResponse } from "@/api/types";

const SORTIE_DISPONIBLE: ContratLocationResponse["statut"][] = ["TERMINE", "RESILIE"];

interface DocumentDescriptor {
  key: string;
  label: string;
  icon: ReactNode;
  fetcher: () => Promise<AxiosResponse<Blob>>;
  filename: string;
}

export function BailleurContratsPage() {
  const [detailMaison, setDetailMaison] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [courFilter, setCourFilter] = useState("");
  const [openContrat, setOpenContrat] = useState<ContratLocationResponse | null>(null);
  const sidebarCollapsed = useBailleurUiStore((s) => s.sidebarCollapsed);
  const contratsQuery = useContratsLocationQuery({ size: 50 });
  const coursQuery = useCoursQuery({ size: 100 });
  const { openPreview, download, downloadPreview, closePreview, preview, isPending } = useDocumentDownload();

  const cours = useMemo(() => coursQuery.data?.content ?? [], [coursQuery.data]);
  const maisonsQueries = useQueries({
    queries: cours.map((cour) => ({
      queryKey: maisonsQueryKeys.list({ idCour: cour.idCour, size: 100 }),
      queryFn: () => maisonsApi.list({ idCour: cour.idCour, size: 100 }),
      enabled: cours.length > 0,
    })),
  });

  // Le contrat n'expose que idMaison : on retrouve la cour via la maison, pour le filtre multi-cours.
  const maisonCourMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const q of maisonsQueries) for (const m of q.data?.content ?? []) map.set(m.idMaison, m.referenceCour);
    return map;
  }, [maisonsQueries]);

  const filtered = useMemo(() => {
    let list = contratsQuery.data?.content ?? [];
    if (courFilter) list = list.filter((c) => maisonCourMap.get(c.idMaison) === courFilter);
    const term = search.trim().toLowerCase();
    if (term) list = list.filter((c) => c.nomCommunMaison.toLowerCase().includes(term) || c.nomLocataire.toLowerCase().includes(term));
    return list;
  }, [contratsQuery.data, courFilter, search, maisonCourMap]);

  function documentsFor(c: ContratLocationResponse): DocumentDescriptor[] {
    return [
      {
        key: `attestation-${c.idContratLocation}`,
        label: "Attestation de loyer",
        icon: <FileCheck2 size={16} className="text-primary-600" aria-hidden="true" />,
        fetcher: () => documentsApi.attestationLoyer(c.idContratLocation),
        filename: `attestation-loyer-${c.idContratLocation}.pdf`,
      },
      {
        key: `contrat-${c.idContratLocation}`,
        label: "Contrat de location",
        icon: <FileText size={16} className="text-primary-600" aria-hidden="true" />,
        fetcher: () => documentsApi.contratLocation(c.idContratLocation),
        filename: `contrat-location-${c.idContratLocation}.pdf`,
      },
      {
        key: `edl-entree-${c.idContratLocation}`,
        label: "État des lieux (entrée)",
        icon: <LogIn size={16} className="text-primary-600" aria-hidden="true" />,
        fetcher: () => documentsApi.etatDesLieux(c.idContratLocation, "entree"),
        filename: `etat-des-lieux-entree-${c.idContratLocation}.pdf`,
      },
      ...(SORTIE_DISPONIBLE.includes(c.statut)
        ? [
            {
              key: `edl-sortie-${c.idContratLocation}`,
              label: "État des lieux (sortie)",
              icon: <LogOut size={16} className="text-primary-600" aria-hidden="true" />,
              fetcher: () => documentsApi.etatDesLieux(c.idContratLocation, "sortie"),
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
          <Home size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {c.nomCommunMaison}
        </span>
      ),
    },
    {
      key: "locataire",
      header: "Locataire",
      render: (c) => (
        <span className="flex items-center gap-2">
          <User size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {c.nomLocataire}
        </span>
      ),
    },
    ...(cours.length > 1
      ? [
          {
            key: "cour",
            header: "Cour",
            render: (c: ContratLocationResponse) => (
              <span className="flex items-center gap-2">
                <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
                {maisonCourMap.get(c.idMaison) ?? "-"}
              </span>
            ),
          },
        ]
      : []),
    { key: "dateEntree", header: "Entrée", render: (c) => formatDate(c.dateEntree) },
    { key: "dateSortie", header: "Sortie", render: (c) => formatDate(c.dateSortie) },
    { key: "loyer", header: "Loyer", align: "right", render: (c) => formatMontant(c.montantLoyer) },
    { key: "statut", header: "Statut", render: (c) => <StatutBadge statut={c.statut} /> },
    {
      key: "documents",
      header: "Actions",
      align: "right",
      render: (c) => {
        if (!sidebarCollapsed) {
          const items: ActionGroupItem[] = [
            { label: "Documents du contrat", text: "Documents", icon: <Files size={15} aria-hidden="true" />, onClick: () => setOpenContrat(c) },
          ];
          return <ActionGroup items={[{ label: "Voir le détail", text: "Détails", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setDetailMaison(c.idMaison) }, ...items]} />;
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
                <span className="flex h-6 w-6 items-center justify-center" aria-hidden="true">
                  {doc.icon}
                </span>
                <button
                  type="button"
                  aria-label={`Aperçu - ${doc.label}`}
                  disabled={isPending(doc.key)}
                  onClick={() => openPreview(doc.key, doc.fetcher, doc.label, doc.filename)}
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
      <MaisonDetailModal idMaison={detailMaison} onClose={() => setDetailMaison(null)} />
      <PageHeader tone="indigo" title="Contrats de location" description="Les contrats de location de vos locataires." />
      {contratsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger ces contrats"
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
            <div className="sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une maison ou un locataire…"
                ariaLabel="Rechercher parmi ces contrats"
              />
            </div>
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(c) => c.idContratLocation}
            loading={contratsQuery.isLoading}
            emptyMessage={search || courFilter ? "Aucun contrat ne correspond à votre recherche" : "Aucun contrat de location pour le moment"}
          />
        </>
      )}

      <Modal
        isOpen={openContrat !== null}
        onClose={() => setOpenContrat(null)}
        title={openContrat ? `Documents - ${openContrat.nomCommunMaison}` : "Documents"}
      >
        {openContrat && (
          <ul className="divide-y divide-slate-100">
            {documentsFor(openContrat).map((doc) => (
              <li key={doc.key} className="flex items-center justify-between gap-3 py-3">
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
                    onClick={() => openPreview(doc.key, doc.fetcher, doc.label, doc.filename)}
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
