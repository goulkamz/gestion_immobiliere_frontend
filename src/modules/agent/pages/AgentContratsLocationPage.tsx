import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AxiosResponse } from "axios";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, CreditCard, Download, Edit2, Eye, FileCheck2, FileText, FileWarning, Files, Home, LogIn, LogOut, User, XCircle } from "lucide-react";
import { ActionGroup, Button, DataTable, DocumentPreviewModal, EmptyState, Input, Modal, PageHeader, Pagination, SearchInput, StatutBadge, Textarea, MaisonDetailModal } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import {
  useContratsLocationQuery,
  useDecompteSortieQuery,
  useModifierContratLocationMutation,
  useReglerDecompteSortieMutation,
  useResilierLocationMutation,
  useTerminerLocationMutation,
} from "@/hooks/queries/useContrats";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { documentsApi } from "@/api/documents";
import {
  cloturerLocationSchema,
  modifierLocationSchema,
  reglerDecompteSchema,
  type CloturerLocationFormInput,
  type CloturerLocationFormValues,
  type ModifierLocationFormInput,
  type ModifierLocationFormValues,
  type ReglerDecompteFormInput,
  type ReglerDecompteFormValues,
} from "../schemas";
import { formatDate, formatMontant } from "@/utils/format";
import { ApiError } from "@/api/http";
import type { ContratLocationResponse, DecompteSortieResponse } from "@/api/types";

const SORTIE_DISPONIBLE: ContratLocationResponse["statut"][] = ["TERMINE", "RESILIE"];

type Cloture = { contrat: ContratLocationResponse; mode: "terminer" | "resilier" };

interface DocumentDescriptor {
  key: string;
  label: string;
  icon: ReactNode;
  fetcher: () => Promise<AxiosResponse<Blob>>;
  filename: string;
}

export function AgentContratsLocationPage() {
  const [detailMaison, setDetailMaison] = useState<number | null>(null);
  // Pré-rempli via ?recherche=... (lien « Voir le contrat » après conversion d'une réservation)
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("recherche") ?? "");
  const [cloture, setCloture] = useState<Cloture | null>(null);
  const [editing, setEditing] = useState<ContratLocationResponse | null>(null);
  const [decompteContrat, setDecompteContrat] = useState<ContratLocationResponse | null>(null);
  const [decompteDirect, setDecompteDirect] = useState<DecompteSortieResponse | null>(null);
  const [regling, setRegling] = useState<DecompteSortieResponse | null>(null);
  const [openDocs, setOpenDocs] = useState<ContratLocationResponse | null>(null);

  const [page, setPage] = useState(0);
  const [rechercheDebounced, setRechercheDebounced] = useState(search.trim());

  // Recherche envoyée au serveur après une courte pause de saisie
  useEffect(() => {
    const timer = setTimeout(() => {
      setRechercheDebounced(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const contratsQuery = useContratsLocationQuery({
    page,
    size: 20,
    sort: "dateEntree,desc",
    recherche: rechercheDebounced || undefined,
  });
  const compteurs = useCompteursStatut(useContratsLocationQuery, { recherche: rechercheDebounced || undefined }, ["EN_ATTENTE", "ACTIF", "TERMINE", "RESILIE"] as const);
  const modifierMutation = useModifierContratLocationMutation();
  const terminerMutation = useTerminerLocationMutation();
  const resilierMutation = useResilierLocationMutation();
  const reglerMutation = useReglerDecompteSortieMutation();
  const decompteQuery = useDecompteSortieQuery(decompteContrat?.idContratLocation ?? 0, { enabled: decompteContrat !== null });
  const { openPreview, download, closePreview, downloadPreview, preview, isPending } = useDocumentDownload();

  const clotureForm = useForm<CloturerLocationFormInput, unknown, CloturerLocationFormValues>({ resolver: zodResolver(cloturerLocationSchema) });
  const editForm = useForm<ModifierLocationFormInput, unknown, ModifierLocationFormValues>({ resolver: zodResolver(modifierLocationSchema) });
  const reglerForm = useForm<ReglerDecompteFormInput, unknown, ReglerDecompteFormValues>({ resolver: zodResolver(reglerDecompteSchema) });

  // Recherche et pagination sont appliquées côté serveur
  const contrats = contratsQuery.data?.content ?? [];

  function openCloture(contrat: ContratLocationResponse, mode: "terminer" | "resilier") {
    setCloture({ contrat, mode });
    clotureForm.reset({});
  }

  async function onCloture(values: CloturerLocationFormValues) {
    if (!cloture) return;
    try {
      const decompte =
        cloture.mode === "terminer"
          ? await terminerMutation.mutateAsync({
              id: cloture.contrat.idContratLocation,
              body: {
                etatDesLieuxSortie: values.etatDesLieuxSortie,
                dateSortie: values.dateSortie ? `${values.dateSortie}T00:00:00` : undefined,
                fraisReparation: values.montantFrais,
              },
            })
          : await resilierMutation.mutateAsync({
              id: cloture.contrat.idContratLocation,
              body: {
                etatDesLieuxSortie: values.etatDesLieuxSortie,
                dateSortie: values.dateSortie ? `${values.dateSortie}T00:00:00` : undefined,
                coutReparation: values.montantFrais,
              },
            });
      toast.success(cloture.mode === "terminer" ? "Contrat terminé." : "Contrat résilié.");
      setCloture(null);
      setDecompteDirect(decompte);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Opération impossible.");
    }
  }

  function openEdit(contrat: ContratLocationResponse) {
    setEditing(contrat);
    editForm.reset({ montantLoyer: contrat.montantLoyer, dateSortie: contrat.dateSortie ? contrat.dateSortie.slice(0, 10) : "" });
  }

  async function onEdit(values: ModifierLocationFormValues) {
    if (!editing) return;
    try {
      await modifierMutation.mutateAsync({
        id: editing.idContratLocation,
        body: { montantLoyer: values.montantLoyer, dateSortie: values.dateSortie ? `${values.dateSortie}T00:00:00` : undefined },
      });
      toast.success("Contrat mis à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible.");
    }
  }

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

  function openRegler(decompte: DecompteSortieResponse) {
    setRegling(decompte);
    reglerForm.reset({});
  }

  async function onRegler(values: ReglerDecompteFormValues) {
    if (!regling) return;
    try {
      await reglerMutation.mutateAsync({ idDecompte: regling.idDecompte, body: values });
      toast.success("Décompte réglé.");
      setRegling(null);
      setDecompteDirect(null);
      setDecompteContrat(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Règlement impossible.");
    }
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
    { key: "dateEntree", header: "Entrée", render: (c) => formatDate(c.dateEntree) },
    { key: "dateSortie", header: "Sortie", render: (c) => formatDate(c.dateSortie) },
    { key: "loyer", header: "Loyer", align: "right", render: (c) => formatMontant(c.montantLoyer) },
    { key: "statut", header: "Statut", render: (c) => <StatutBadge statut={c.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => {
        const items: ActionGroupItem[] = [];
        if (c.statut === "ACTIF") {
          items.push(
            { label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(c) },
            { label: "Terminer le contrat", text: "Terminer", icon: <LogOut size={15} aria-hidden="true" />, onClick: () => openCloture(c, "terminer") },
            { label: "Résilier le contrat", icon: <XCircle size={15} aria-hidden="true" />, tone: "danger", onClick: () => openCloture(c, "resilier") },
          );
        }
        if (SORTIE_DISPONIBLE.includes(c.statut)) {
          items.push({
            label: "Décompte de sortie",
            text: "Décompte",
            icon: <FileWarning size={15} aria-hidden="true" />,
            onClick: () => setDecompteContrat(c),
          });
        }
        items.push({ label: "Documents du contrat", text: "Documents", icon: <Files size={15} aria-hidden="true" />, onClick: () => setOpenDocs(c) });
        return <ActionGroup items={[{ label: "Voir le détail", text: "Détails", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setDetailMaison(c.idMaison) }, ...items]} />;
      },
    },
  ];

  const decompteAffiche = decompteDirect ?? decompteQuery.data;

  return (
    <div>
      <MaisonDetailModal idMaison={detailMaison} onClose={() => setDetailMaison(null)} />
      <PageHeader tone="indigo" title="Contrats de location" description="Les contrats de location gérés par l'agence." />

      <CompteursStatut compteurs={compteurs} statuts={["EN_ATTENTE", "ACTIF", "TERMINE", "RESILIE"] as const} />

      {contratsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les contrats"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une maison ou un locataire…" ariaLabel="Rechercher parmi les contrats" />
          </div>
          <DataTable
            data={contrats}
            columns={columns}
            keyExtractor={(c) => c.idContratLocation}
            loading={contratsQuery.isLoading}
            emptyMessage={search ? "Aucun contrat ne correspond à votre recherche" : "Aucun contrat de location pour le moment"}
          />
          {contratsQuery.data && (
            <Pagination
              currentPage={contratsQuery.data.page.number}
              totalPages={contratsQuery.data.page.totalPages}
              totalElements={contratsQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={cloture !== null}
        onClose={() => setCloture(null)}
        title={cloture?.mode === "terminer" ? "Terminer le contrat" : "Résilier le contrat"}
        titleTone="indigo"
      >
        {cloture && (
          <form className="space-y-4" onSubmit={clotureForm.handleSubmit(onCloture)} noValidate>
            <p className="text-sm text-slate-600">
              <strong>{cloture.contrat.nomLocataire}</strong> - <strong>{cloture.contrat.nomCommunMaison}</strong>
            </p>
            <Textarea
              label="État des lieux de sortie"
              required
              error={clotureForm.formState.errors.etatDesLieuxSortie?.message}
              {...clotureForm.register("etatDesLieuxSortie")}
            />
            <Input label="Date de sortie" type="date" {...clotureForm.register("dateSortie")} helperText="Laissez vide pour utiliser la date du jour." />
            <Input
              label={cloture.mode === "terminer" ? "Frais de réparation (F CFA)" : "Coût de réparation (F CFA)"}
              type="number"
              min={0}
              required
              error={clotureForm.formState.errors.montantFrais?.message}
              {...clotureForm.register("montantFrais")}
            />
            <Button type="submit" variant={cloture.mode === "resilier" ? "danger" : "primary"} fullWidth loading={terminerMutation.isPending || resilierMutation.isPending}>
              Confirmer
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Modifier - ${editing.nomCommunMaison}` : "Modifier"}
        titleTone="indigo"
      >
        {editing && (
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)} noValidate>
            <p className="text-sm text-slate-600">
              <strong>{editing.nomLocataire}</strong> - <strong>{editing.nomCommunMaison}</strong>
            </p>
            <Input
              label="Loyer mensuel (F CFA)"
              type="number"
              min={0}
              error={editForm.formState.errors.montantLoyer?.message}
              {...editForm.register("montantLoyer")}
            />
            <Input
              label="Date de sortie prévue"
              type="date"
              helperText="Prolongez ou réduisez le bail sans le clôturer. Laissez vide pour une durée indéterminée."
              {...editForm.register("dateSortie")}
            />
            <Button type="submit" fullWidth loading={modifierMutation.isPending}>
              Enregistrer
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={decompteDirect !== null || decompteContrat !== null}
        onClose={() => {
          setDecompteDirect(null);
          setDecompteContrat(null);
        }}
        title="Décompte de sortie"
        titleTone="indigo"
      >
        {decompteQuery.isLoading && !decompteDirect ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : decompteAffiche ? (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Avance de référence</dt>
              <dd className="text-right font-medium text-slate-900">{formatMontant(decompteAffiche.montantAvanceReference)}</dd>
              <dt className="text-slate-500">Caution de référence</dt>
              <dd className="text-right font-medium text-slate-900">{formatMontant(decompteAffiche.montantCautionReference)}</dd>
              <dt className="text-slate-500">Arriérés de loyer</dt>
              <dd className="text-right font-medium text-danger-600">{formatMontant(decompteAffiche.montantArrieres)}</dd>
              <dt className="text-slate-500">Coût de réparation</dt>
              <dd className="text-right font-medium text-danger-600">{formatMontant(decompteAffiche.coutReparation)}</dd>
              <dt className="border-t border-slate-100 pt-2 text-slate-500">Montant manquant (dû par le locataire)</dt>
              <dd className="border-t border-slate-100 pt-2 text-right font-semibold text-danger-700">{formatMontant(decompteAffiche.montantManquant)}</dd>
              <dt className="text-slate-500">Montant à rembourser au locataire</dt>
              <dd className="text-right font-semibold text-success-700">{formatMontant(decompteAffiche.montantARembourser)}</dd>
              <dt className="text-slate-500">Statut</dt>
              <dd className="text-right">
                <StatutBadge statut={decompteAffiche.statut} />
              </dd>
            </dl>
            <div className="flex gap-2">
              {decompteAffiche.statut === "EN_ATTENTE" && (
                <Button className="flex-1" icon={<CreditCard size={16} />} onClick={() => openRegler(decompteAffiche)}>
                  Régler ce décompte
                </Button>
              )}
              <Button
                variant="secondary"
                className="flex-1"
                icon={<Download size={16} />}
                disabled={isPending(`decompte-${decompteAffiche.idDecompte}`)}
                onClick={() =>
                  download(
                    `decompte-${decompteAffiche.idDecompte}`,
                    () => documentsApi.decompteSortie(decompteAffiche.idDecompte),
                    `decompte-sortie-${decompteAffiche.idDecompte}.pdf`,
                  )
                }
              >
                Télécharger le PDF
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun décompte disponible.</p>
        )}
      </Modal>

      <Modal
        isOpen={openDocs !== null}
        onClose={() => setOpenDocs(null)}
        title={openDocs ? `Documents - ${openDocs.nomCommunMaison}` : "Documents"}
        titleTone="indigo"
      >
        {openDocs && (
          <ul className="divide-y divide-slate-100">
            {documentsFor(openDocs).map((doc) => (
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

      <Modal isOpen={regling !== null} onClose={() => setRegling(null)} title="Régler le décompte" titleTone="indigo">
        {regling && (
          <form className="space-y-4" onSubmit={reglerForm.handleSubmit(onRegler)} noValidate>
            <Input
              label="Mode de paiement"
              required
              placeholder="Espèces, Virement, Mobile Money…"
              error={reglerForm.formState.errors.modePaiement?.message}
              {...reglerForm.register("modePaiement")}
            />
            <Input label="Référence (optionnel)" {...reglerForm.register("reference")} />
            <Button type="submit" fullWidth loading={reglerMutation.isPending}>
              Confirmer le règlement
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
