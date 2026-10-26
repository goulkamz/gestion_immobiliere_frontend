import { useCible } from "@/hooks/useLigneCiblee";
import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, Download, Eye, Home, Package } from "lucide-react";
import { DataTable, DocumentPreviewModal, EmptyState, PageHeader, SearchInput, StatutBadge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { useClientEcheancesStatsQuery } from "@/hooks/queries/useStatsClient";
import { useLocationsQuery } from "@/hooks/queries/useLocations";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { documentsApi } from "@/api/documents";
import { formatDateTime, formatDate, formatMontant } from "@/utils/format";
import type { ClientEcheanceDTO, LocationBienServiceResponse, PaiementLocationBienServiceResponse } from "@/api/types";

type Onglet = "loyer" | "location";

interface PaiementLocationRow extends PaiementLocationBienServiceResponse {
  libelleBienService: string;
}

export function ClientRecusPage() {
  const { cibleId, effacer: effacerCible } = useCible();
  // Un reçu ciblé par une notification est un paiement de location de bien/service : on ouvre directement cet onglet
  const [tab, setTab] = useState<Onglet>(cibleId !== null ? "location" : "loyer");
  const [search, setSearch] = useState("");
  const echeancesQuery = useClientEcheancesStatsQuery();
  const locationsQuery = useLocationsQuery({ size: 100 });
  const { openPreview, download, downloadPreview, closePreview, preview, isPending } = useDocumentDownload();

  const echeancesPayees = useMemo(() => (echeancesQuery.data ?? []).filter((e) => e.statut === "PAYE"), [echeancesQuery.data]);

  const paiementsLocations = useMemo<PaiementLocationRow[]>(() => {
    const locations = locationsQuery.data?.content ?? [];
    return locations.flatMap((l: LocationBienServiceResponse) =>
      l.historiquePaiements.map((p) => ({ ...p, libelleBienService: l.libelleBienService })),
    );
  }, [locationsQuery.data]);

  const term = search.trim().toLowerCase();
  const filteredEcheances = term
    ? echeancesPayees.filter(
        (e) => (e.moisLibelle ?? "").toLowerCase().includes(term) || (e.nomCommunMaison ?? "").toLowerCase().includes(term),
      )
    : echeancesPayees;
  const filteredPaiements = term
    ? paiementsLocations.filter((p) => p.idPaiement === cibleId || p.libelleBienService.toLowerCase().includes(term))
    : paiementsLocations;

  const echeancesColumns: DataTableColumn<ClientEcheanceDTO>[] = [
    { key: "maison", header: "Maison", render: (e) => e.nomCommunMaison ?? "-" },
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
    { key: "echeance", header: "Échéance", render: (e) => formatDate(e.dateEcheance) },
    { key: "paye", header: "Montant payé", align: "right", render: (e) => formatMontant(e.montantPaye) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (e) => {
        const key = `quittance-${e.idEcheance}`;
        const fetcher = () => documentsApi.quittance(e.idEcheance);
        const title = `Quittance - ${e.nomCommunMaison ? `${e.nomCommunMaison}, ` : ""}${e.moisLibelle ?? formatDate(e.dateEcheance)}`;
        return (
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-primary-100 bg-primary-50/60 p-0.5">
            <button
              type="button"
              title="Aperçu"
              aria-label={`Aperçu - ${title}`}
              disabled={isPending(key)}
              onClick={() => openPreview(key, fetcher, title, `quittance-${e.idEcheance}.pdf`)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-primary-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Télécharger"
              aria-label={`Télécharger - ${title}`}
              disabled={isPending(key)}
              onClick={() => download(key, fetcher, `quittance-${e.idEcheance}.pdf`)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-primary-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} aria-hidden="true" />
            </button>
          </div>
        );
      },
    },
  ];

  const paiementsColumns: DataTableColumn<PaiementLocationRow>[] = [
    {
      key: "bien",
      header: "Bien / service",
      render: (p) => (
        <span className="flex items-center gap-2">
          <Package size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {p.libelleBienService}
        </span>
      ),
    },
    { key: "date", header: "Date de paiement", render: (p) => formatDateTime(p.datePaiement) },
    { key: "montant", header: "Montant", align: "right", render: (p) => formatMontant(p.montant) },
    { key: "mode", header: "Mode", render: (p) => p.modePaiement },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => {
        const key = `recu-${p.idPaiement}`;
        const fetcher = () => documentsApi.recu(p.idPaiement);
        const title = `Reçu - ${p.libelleBienService}`;
        return (
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-primary-100 bg-primary-50/60 p-0.5">
            <button
              type="button"
              title="Aperçu"
              aria-label={`Aperçu - ${title}`}
              disabled={isPending(key)}
              onClick={() => openPreview(key, fetcher, title, `recu-${p.idPaiement}.pdf`)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-primary-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Télécharger"
              aria-label={`Télécharger - ${title}`}
              disabled={isPending(key)}
              onClick={() => download(key, fetcher, `recu-${p.idPaiement}.pdf`)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-primary-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} aria-hidden="true" />
            </button>
          </div>
        );
      },
    },
  ];

  const isError = echeancesQuery.isError || locationsQuery.isError;

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Mes reçus de paiement"
        description="Vos quittances de loyer et vos reçus de location de biens & services, au même endroit."
      />

      {isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos reçus"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50/60 p-1">
              <button
                type="button"
                onClick={() => setTab("loyer")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  tab === "loyer" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-primary-700"
                }`}
              >
                <Home size={14} aria-hidden="true" />
                Loyer
              </button>
              <button
                type="button"
                onClick={() => setTab("location")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  tab === "location" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-primary-700"
                }`}
              >
                <Package size={14} aria-hidden="true" />
                Location
              </button>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={tab === "loyer" ? "Rechercher une maison ou une période…" : "Rechercher un bien ou service…"}
              ariaLabel="Rechercher parmi mes reçus"
              className="sm:w-64"
            />
          </div>

          {tab === "loyer" ? (
            <DataTable
              data={filteredEcheances}
              columns={echeancesColumns}
              keyExtractor={(e) => e.idEcheance}
              loading={echeancesQuery.isLoading}
              emptyMessage={search ? "Aucune quittance ne correspond à votre recherche" : "Aucune échéance payée pour le moment"}
            />
          ) : (
            <DataTable
              data={filteredPaiements}
              highlightKey={cibleId}
              onDismissHighlight={effacerCible}
              columns={paiementsColumns}
              keyExtractor={(p) => p.idPaiement}
              loading={locationsQuery.isLoading}
              emptyMessage={search ? "Aucun reçu ne correspond à votre recherche" : "Aucun paiement de location pour le moment"}
            />
          )}
        </>
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
