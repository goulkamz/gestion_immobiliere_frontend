import { useVilleFiltre } from "@/hooks/useVilleFiltre";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Building2, CheckCircle2, Download, Edit2, Eye, FilePen, FileSignature, Plus, User, XCircle } from "lucide-react";
import { AvenantFields } from "@/components/ui/AvenantFields";
import { AvenantsModal } from "@/components/ui/AvenantsModal";
import { documentsAvenants } from "@/utils/avenants";
import { ActionGroup, Button, DataTable, DocumentPreviewModal, EmptyState, Input, Modal, PageHeader, Pagination, SearchInput, RemoteCombobox, Select, StatutBadge, Textarea, CourDetailModalById } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useCoursSansMandatActifOptions } from "@/hooks/useOptionsSelection";
import {
  useActiverContratMandatMutation,
  useAvenantsMandatQuery,
  useContratsMandatQuery,
  useCreateContratMandatMutation,
  useModesFacturationQuery,
  useModifierContratMandatMutation,
  useResilierContratMandatMutation,
} from "@/hooks/queries/useContratsMandat";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { documentsApi } from "@/api/documents";
import { useSessionStore, selectRole } from "@/store/sessionStore";
import {
  mandatCreateSchema,
  mandatEditSchema,
  resilierMandatSchema,
  type MandatCreateFormInput,
  type MandatCreateFormValues,
  type MandatEditFormInput,
  type MandatEditFormValues,
  type ResilierMandatFormInput,
  type ResilierMandatFormValues,
} from "../schemas";
import { ApiError } from "@/api/http";
import { statutLabel } from "@/utils/statut";
import { MODE_FACTURATION_LABELS } from "@/utils/mandat";
import type { ContratMandatResponse, ModeFacturation, StatutMandat, TypeMandat } from "@/api/types";

const TYPE_MANDAT_LABELS: Record<TypeMandat, string> = { GESTION: "Gestion", LOCATION: "Location", VENTE: "Vente" };
// LOCATION et VENTE traitées hors système (annonces) pour l'instant : non proposées à la création ni à la modification
const TYPES_DISPONIBLES: TypeMandat[] = ["GESTION"];
const STATUTS: StatutMandat[] = ["EN_ATTENTE", "ACTIF", "RESILIE", "EXPIRE"];
const MODIFIABLE: StatutMandat[] = ["EN_ATTENTE", "ACTIF"];

export function AgentMandatsPage() {
  // Créer, modifier, activer et résilier un mandat est réservé aux agents : l'agent du mandat est celui qui agit,
  // un admin qui le ferait en deviendrait l'agent en charge. L'admin consulte seulement.
  const peutGererMandats = useSessionStore(selectRole) !== "ROLE_ADMIN";
  const [detailCour, setDetailCour] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutMandat | "">("");
  const [page, setPage] = useState(0);
  const [rechercheDebounced, setRechercheDebounced] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ContratMandatResponse | null>(null);
  const [avenantsMandat, setAvenantsMandat] = useState<ContratMandatResponse | null>(null);
  const [activating, setActivating] = useState<ContratMandatResponse | null>(null);
  const [resiliating, setResiliating] = useState<ContratMandatResponse | null>(null);

  // Recherche envoyée au serveur après une courte pause de saisie
  useEffect(() => {
    const timer = setTimeout(() => {
      setRechercheDebounced(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const idUser = useSessionStore((s) => s.profile?.idUser);
  const villeFiltre = useVilleFiltre();
  const mandatsQuery = useContratsMandatQuery({
    ...villeFiltre,
    page,
    size: 20,
    statut: statutFilter || undefined,
    recherche: rechercheDebounced || undefined,
  });
  const compteurs = useCompteursStatut(useContratsMandatQuery, { ...villeFiltre, recherche: rechercheDebounced || undefined }, ["EN_ATTENTE", "ACTIF", "RESILIE", "EXPIRE"] as const);
  const createMutation = useCreateContratMandatMutation();
  const modifierMutation = useModifierContratMandatMutation();
  const activerMutation = useActiverContratMandatMutation();
  const resilierMutation = useResilierContratMandatMutation();
  const { openPreview, download, closePreview, downloadPreview, preview, isPending } = useDocumentDownload();
  const avenantsQuery = useAvenantsMandatQuery(avenantsMandat?.idMandat ?? 0, { enabled: avenantsMandat !== null });

  const createForm = useForm<MandatCreateFormInput, unknown, MandatCreateFormValues>({ resolver: zodResolver(mandatCreateSchema) });
  const editForm = useForm<MandatEditFormInput, unknown, MandatEditFormValues>({ resolver: zodResolver(mandatEditSchema) });
  const resilierForm = useForm<ResilierMandatFormInput, unknown, ResilierMandatFormValues>({ resolver: zodResolver(resilierMandatSchema) });

  const mandats = useMemo(() => mandatsQuery.data?.content ?? [], [mandatsQuery.data]);

  // Les cours ayant déjà un mandat actif ne peuvent pas en recevoir un second (l'activation
  // échouerait) : le sélecteur n'interroge que les cours sans mandat actif, côté serveur.
  const courChoisie = createForm.watch("idCour");

  // Modes de facturation proposés selon le type de mandat choisi (liste fournie par le serveur)
  const modesQuery = useModesFacturationQuery();
  const typeCree = createForm.watch("typeMandat");
  const typeEdite = editForm.watch("typeMandat");
  const modesCree: ModeFacturation[] = (typeCree && modesQuery.data?.[typeCree]) || [];
  const modesEdite: ModeFacturation[] = (typeEdite && modesQuery.data?.[typeEdite]) || [];
  const modeOptions = (modes: ModeFacturation[]) => modes.map((m) => ({ value: m, label: MODE_FACTURATION_LABELS[m] }));

  // Un seul mode possible : présélectionné. Mode devenu invalide après changement de type : vidé.
  useEffect(() => {
    if (!typeCree || !modesQuery.data) return;
    const courant = createForm.getValues("modeFacturation");
    const unique = modesCree.length === 1 ? modesCree[0] : undefined;
    if (unique) createForm.setValue("modeFacturation", unique);
    else if (courant && !modesCree.includes(courant)) createForm.resetField("modeFacturation");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeCree, modesQuery.data]);

  useEffect(() => {
    if (!typeEdite || !modesQuery.data) return;
    const courant = editForm.getValues("modeFacturation");
    const unique = modesEdite.length === 1 ? modesEdite[0] : undefined;
    if (unique) editForm.setValue("modeFacturation", unique);
    else if (courant && !modesEdite.includes(courant)) editForm.resetField("modeFacturation");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeEdite, modesQuery.data]);

  async function onCreate(values: MandatCreateFormValues) {
    if (!idUser) return;
    try {
      await createMutation.mutateAsync({
        idCour: values.idCour,
        idAgent: idUser,
        typeMandat: values.typeMandat,
        dateDebut: `${values.dateDebut}T00:00:00`,
        dateFin: values.dateFin ? `${values.dateFin}T00:00:00` : undefined,
        commission: values.commission,
        modeFacturation: values.modeFacturation,
      });
      toast.success("Mandat créé, en attente d'activation.");
      createForm.reset({});
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Création impossible.");
    }
  }

  function openEdit(mandat: ContratMandatResponse) {
    setEditing(mandat);
    editForm.reset({
      typeMandat: mandat.typeMandat,
      dateFin: mandat.dateFin ? mandat.dateFin.slice(0, 10) : "",
      commission: mandat.commission ?? undefined,
      modeFacturation: mandat.modeFacturation ?? undefined,
      motif: "",
      accordClient: false,
    });
  }

  async function onEdit(values: MandatEditFormValues) {
    if (!editing) return;
    // Mandat actif : la modification crée un avenant, il faut un motif et l'accord du client
    const actif = editing.statut === "ACTIF";
    if (actif) {
      let invalide = false;
      if (!values.motif?.trim()) {
        editForm.setError("motif", { message: "Le motif est obligatoire" });
        invalide = true;
      }
      if (!values.accordClient) {
        editForm.setError("accordClient", { message: "Confirmez que le client a accepté la modification" });
        invalide = true;
      }
      if (invalide) return;
    }
    try {
      const reponse = await modifierMutation.mutateAsync({
        id: editing.idMandat,
        body: {
          typeMandat: values.typeMandat,
          dateFin: values.dateFin ? `${values.dateFin}T00:00:00` : undefined,
          commission: values.commission,
          modeFacturation: values.modeFacturation,
          ...(actif ? { motif: values.motif, accordClient: true } : {}),
        },
      });
      const idAvenant = reponse.idAvenant;
      if (idAvenant !== undefined) {
        toast.success(
          <span>
            Mandat mis à jour, avenant n°{reponse.numeroAvenant} créé.{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => download(`avenant-${idAvenant}`, () => documentsApi.avenant(idAvenant), `avenant-${reponse.numeroAvenant}-mandat-${reponse.idMandat}.pdf`)}
            >
              Télécharger l&apos;avenant
            </button>
          </span>,
          { autoClose: 10000 },
        );
      } else {
        toast.success("Mandat mis à jour.");
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible.");
    }
  }

  async function handleActiver() {
    if (!activating) return;
    try {
      await activerMutation.mutateAsync(activating.idMandat);
      toast.success("Mandat activé.");
      setActivating(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Activation impossible.");
    }
  }

  function openResilier(mandat: ContratMandatResponse) {
    setResiliating(mandat);
    resilierForm.reset({ motifResiliation: "" });
  }

  async function onResilier(values: ResilierMandatFormValues) {
    if (!resiliating) return;
    try {
      await resilierMutation.mutateAsync({ id: resiliating.idMandat, body: values });
      toast.success("Mandat résilié.");
      setResiliating(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Résiliation impossible.");
    }
  }

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
    {
      key: "proprietaire",
      header: "Propriétaire",
      render: (m) => (
        <span className="flex items-center gap-2">
          <User size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {m.nomProprietaire}
        </span>
      ),
    },
    { key: "agent", header: "Agent", render: (m) => m.nomAgent },
    { key: "type", header: "Type", render: (m) => TYPE_MANDAT_LABELS[m.typeMandat] },
    { key: "facturation", header: "Facturation", render: (m) => (m.modeFacturation ? MODE_FACTURATION_LABELS[m.modeFacturation] : "-") },
    { key: "commission", header: "Commission", align: "right", render: (m) => (m.commission !== null ? `${m.commission} %` : "-") },
    { key: "statut", header: "Statut", render: (m) => <StatutBadge statut={m.statut} /> },
    {
      key: "contrat",
      header: "Contrat",
      align: "right",
      render: (m) => (
        <div className="inline-flex items-center gap-1">
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
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (m) => {
        const items: ActionGroupItem[] = [];
        if (peutGererMandats && MODIFIABLE.includes(m.statut)) {
          items.push({ label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(m) });
        }
        if (peutGererMandats && m.statut === "EN_ATTENTE") {
          items.push({ label: "Activer", text: "Activer", icon: <CheckCircle2 size={15} aria-hidden="true" />, onClick: () => setActivating(m) });
        }
        if (m.statut !== "EN_ATTENTE") {
          items.push({ label: "Avenants du mandat", text: "Avenants", icon: <FilePen size={15} aria-hidden="true" />, onClick: () => setAvenantsMandat(m) });
        }
        if (peutGererMandats && m.statut === "ACTIF") {
          items.push({ label: "Résilier", text: "Résilier", icon: <XCircle size={15} aria-hidden="true" />, tone: "danger", onClick: () => openResilier(m) });
        }
        return <ActionGroup items={[{ label: "Voir le détail", text: "Détails", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setDetailCour(m.idCour) }, ...items]} />;
      },
    },
  ];

  return (
    <div>
      <CourDetailModalById idCour={detailCour} onClose={() => setDetailCour(null)} />
      <PageHeader
        tone="indigo"
        title="Mandats"
        description={
          peutGererMandats
            ? "Les mandats de gestion confiés à l'agence."
            : "Les mandats de gestion confiés à l'agence, en consultation : ils sont créés et gérés par les agents."
        }
        actions={
          peutGererMandats && (
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => {
                createForm.reset({});
                setCreateOpen(true);
              }}
            >
              Nouveau mandat
            </Button>
          )
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={["EN_ATTENTE", "ACTIF", "RESILIE", "EXPIRE"] as const} />

      {mandatsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les mandats"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-48">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutMandat | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une cour, un agent, un propriétaire…"
                ariaLabel="Rechercher parmi les mandats"
              />
            </div>
          </div>
          <DataTable
            data={mandats}
            columns={columns}
            keyExtractor={(m) => m.idMandat}
            loading={mandatsQuery.isLoading}
            emptyMessage={search || statutFilter ? "Aucun mandat ne correspond à votre recherche" : "Aucun mandat enregistré pour le moment"}
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

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau mandat" titleTone="indigo">
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
          <RemoteCombobox
            label="Cour"
            required
            placeholder="Rechercher une cour (référence, propriétaire)"
            useOptions={useCoursSansMandatActifOptions}
            value={courChoisie}
            error={createForm.formState.errors.idCour?.message}
            {...createForm.register("idCour")}
          />
          <Select
            label="Type de mandat"
            required
            placeholder="Sélectionner"
            defaultValue=""
            options={TYPES_DISPONIBLES.map((value) => ({ value, label: TYPE_MANDAT_LABELS[value] }))}
            error={createForm.formState.errors.typeMandat?.message}
            {...createForm.register("typeMandat")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date de début" type="date" required error={createForm.formState.errors.dateDebut?.message} {...createForm.register("dateDebut")} />
            <Input label="Date de fin" type="date" error={createForm.formState.errors.dateFin?.message} {...createForm.register("dateFin")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Commission (%)" type="number" min={0} step="0.01" {...createForm.register("commission")} />
            <Select
              label="Mode de facturation"
              required
              placeholder={typeCree ? "Sélectionner" : "Choisissez d'abord un type"}
              defaultValue=""
              disabled={!typeCree}
              options={modeOptions(modesCree)}
              error={createForm.formState.errors.modeFacturation?.message}
              {...createForm.register("modeFacturation")}
            />
          </div>
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Créer le mandat
          </Button>
        </form>
      </Modal>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing ? `Modifier - ${editing.referenceCour}` : "Modifier"} titleTone="indigo">
        {editing && (
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)} noValidate>
            <Select
              label="Type de mandat"
              required
              options={TYPES_DISPONIBLES.map((value) => ({ value, label: TYPE_MANDAT_LABELS[value] }))}
              error={editForm.formState.errors.typeMandat?.message}
              {...editForm.register("typeMandat")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Date de fin" type="date" error={editForm.formState.errors.dateFin?.message} {...editForm.register("dateFin")} />
              <Input label="Commission (%)" type="number" min={0} step="0.01" {...editForm.register("commission")} />
            </div>
            <Select
              label="Mode de facturation"
              required
              placeholder="Sélectionner"
              options={modeOptions(modesEdite)}
              error={editForm.formState.errors.modeFacturation?.message}
              {...editForm.register("modeFacturation")}
            />
            {editing.statut === "ACTIF" && (
              <AvenantFields
                motif={editForm.register("motif")}
                accord={editForm.register("accordClient")}
                errors={{ motif: editForm.formState.errors.motif?.message, accord: editForm.formState.errors.accordClient?.message }}
              />
            )}
            <Button type="submit" fullWidth loading={modifierMutation.isPending}>
              Enregistrer
            </Button>
          </form>
        )}
      </Modal>

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

      <Modal isOpen={activating !== null} onClose={() => setActivating(null)} title="Activer ce mandat ?" titleTone="indigo">
        {activating && (
          <>
            <p className="text-sm text-slate-600">
              Vous êtes sur le point d&apos;activer le mandat sur <strong>{activating.referenceCour}</strong>. Vous en devenez
              l&apos;agent responsable.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setActivating(null)}>
                Annuler
              </Button>
              <Button variant="primary" className="flex-1" loading={activerMutation.isPending} onClick={handleActiver}>
                Activer
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={resiliating !== null} onClose={() => setResiliating(null)} title="Résilier ce mandat" titleTone="indigo">
        {resiliating && (
          <form className="space-y-4" onSubmit={resilierForm.handleSubmit(onResilier)} noValidate>
            <p className="text-sm text-slate-600">
              Résiliation du mandat sur <strong>{resiliating.referenceCour}</strong>.
            </p>
            <Textarea
              label="Motif de résiliation"
              required
              error={resilierForm.formState.errors.motifResiliation?.message}
              {...resilierForm.register("motifResiliation")}
            />
            <Button type="submit" variant="danger" fullWidth loading={resilierMutation.isPending}>
              <FileSignature size={16} aria-hidden="true" />
              Confirmer la résiliation
            </Button>
          </form>
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
