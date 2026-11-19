import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Ban, Building2, CalendarClock, Edit2, Eye, HandCoins, Info, Plus, Scale, Undo2 } from "lucide-react";
import {
  ActionGroup,
  Button,
  CompteursStatut,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  RemoteCombobox,
  SearchInput,
  Select,
  StatutBadge,
  Textarea,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { DepenseDetailModal } from "@/components/ui/DepenseDetailModal";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { useCoursOptions, useCoursSousGestionOptions } from "@/hooks/useOptionsSelection";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useMaisonsGestionQuery } from "@/hooks/queries/useMaisons";
import {
  useAbandonnerDepenseMutation,
  useAnnulerDepenseMutation,
  useCreateDepenseMutation,
  useDepensesQuery,
  useMandatsEchusQuery,
  useReechelonnerDepenseMutation,
  useReglementDepenseMutation,
  useRetablirCreanceMutation,
  useUpdateDepenseMutation,
} from "@/hooks/queries/useDepenses";
import { useSessionStore, selectRole } from "@/store/sessionStore";
import {
  abandonnerDepenseSchema,
  annulerDepenseSchema,
  depenseCreateSchema,
  reechelonnerDepenseSchema,
  reglementDepenseSchema,
  type AbandonnerDepenseFormInput,
  type AbandonnerDepenseFormValues,
  type AnnulerDepenseFormInput,
  type AnnulerDepenseFormValues,
  type DepenseCreateFormInput,
  type DepenseCreateFormValues,
  type ReechelonnerDepenseFormInput,
  type ReechelonnerDepenseFormValues,
  type ReglementDepenseFormInput,
  type ReglementDepenseFormValues,
} from "../schemas";
import { ApiError } from "@/api/http";
import { formatDate, formatMontant } from "@/utils/format";
import { CATEGORIE_DEPENSE_LABELS, CATEGORIES_DEPENSE, STATUTS_DEPENSE, retenueLabel } from "@/utils/depense";
import { statutLabel } from "@/utils/statut";
import type { DepenseResponse, StatutDepense } from "@/api/types";

const STATUTS = STATUTS_DEPENSE;
const LIBELLES_COMPTEURS: Partial<Record<StatutDepense, string>> = {
  EN_COURS: "En cours de retenue",
  A_REGLER: "Dues par les bailleurs",
  SOLDEE: "Soldées",
  ANNULEE: "Annulées",
};

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Modifiable ou annulable seulement tant qu'aucun reversement n'a retenu une partie de la dépense. */
function nonEntamee(d: DepenseResponse): boolean {
  return d.statut === "EN_COURS" && d.montantImpute === 0;
}

export function AgentDepensesPage() {
  const [statutFilter, setStatutFilter] = useState<StatutDepense | "">("");
  const [idCourFilter, setIdCourFilter] = useState<number | "">("");
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepenseResponse | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<DepenseResponse | null>(null);
  const [rescheduling, setRescheduling] = useState<DepenseResponse | null>(null);
  const [settling, setSettling] = useState<DepenseResponse | null>(null);
  const [waiving, setWaiving] = useState<DepenseResponse | null>(null);
  const [restoring, setRestoring] = useState<DepenseResponse | null>(null);
  // L'abandon de créance est une décision de l'admin (l'accès aux pages agent lui est ouvert)
  const isAdmin = useSessionStore(selectRole) === "ROLE_ADMIN";

  const filtres = { idCour: idCourFilter === "" ? undefined : idCourFilter, recherche: recherche || undefined };
  const depensesQuery = useDepensesQuery({ ...filtres, statut: statutFilter || undefined, page, size: 20, sort: "dateDepense,desc" });
  const compteurs = useCompteursStatut(useDepensesQuery, filtres, STATUTS);
  const mandatsEchusQuery = useMandatsEchusQuery();
  const mandatsEchus = mandatsEchusQuery.data ?? [];

  const createMutation = useCreateDepenseMutation();
  const updateMutation = useUpdateDepenseMutation();
  const annulerMutation = useAnnulerDepenseMutation();
  const reechelonnerMutation = useReechelonnerDepenseMutation();
  const reglementMutation = useReglementDepenseMutation();
  const abandonMutation = useAbandonnerDepenseMutation();
  const retablirMutation = useRetablirCreanceMutation();
  const retablirForm = useForm<AbandonnerDepenseFormInput, unknown, AbandonnerDepenseFormValues>({ resolver: zodResolver(abandonnerDepenseSchema) });

  const form = useForm<DepenseCreateFormInput, unknown, DepenseCreateFormValues>({ resolver: zodResolver(depenseCreateSchema) });
  const annulerForm = useForm<AnnulerDepenseFormInput, unknown, AnnulerDepenseFormValues>({ resolver: zodResolver(annulerDepenseSchema) });
  const abandonForm = useForm<AbandonnerDepenseFormInput, unknown, AbandonnerDepenseFormValues>({ resolver: zodResolver(abandonnerDepenseSchema) });
  const reechelonnerForm = useForm<ReechelonnerDepenseFormInput, unknown, ReechelonnerDepenseFormValues>({
    resolver: zodResolver(reechelonnerDepenseSchema),
  });
  const reglementForm = useForm<ReglementDepenseFormInput, unknown, ReglementDepenseFormValues>({ resolver: zodResolver(reglementDepenseSchema) });

  // Rééchelonnement : raccourcir augmente les retenues, donc demande l'accord du bailleur
  const moisRestantsActuels = rescheduling?.moisRestants ?? 1;
  const nouveauxMois = Number(reechelonnerForm.watch("nombreMoisRestants")) || 0;
  const raccourcit = rescheduling !== null && nouveauxMois >= 1 && nouveauxMois < moisRestantsActuels;

  const depenses = useMemo(() => depensesQuery.data?.content ?? [], [depensesQuery.data]);

  // Cour choisie dans le formulaire : on en tire le mandat de gestion (plafond) et ses maisons
  const idCourSaisi = Number(form.watch("idCour")) || undefined;
  const montantSaisi = Number(form.watch("montant")) || 0;
  const nombreMoisSaisi = Number(form.watch("nombreMois")) || 1;
  const mandatQuery = useContratsMandatQuery({ idCour: idCourSaisi, statut: "ACTIF", size: 5 }, { enabled: formOpen && idCourSaisi !== undefined });
  const maisonsQuery = useMaisonsGestionQuery(
    { idCour: idCourSaisi, size: 100, sort: "nomCommunMaison,asc" },
    { enabled: formOpen && editing === null && idCourSaisi !== undefined },
  );
  const mandat = idCourSaisi !== undefined ? mandatQuery.data?.content.find((m) => m.typeMandat === "GESTION" && m.idCour === idCourSaisi) : undefined;
  const plafond = mandat?.plafondDepenseSansAccord ?? null;
  // Dépense issue d'un devis accepté : l'accord est déjà acquis, l'étalement est figé
  const issueDunDevis = editing !== null && editing.idDevis !== null;
  const depassePlafond = !issueDunDevis && plafond !== null && montantSaisi > plafond;

  // La maison dépend de la cour : on la vide quand la cour change (création seulement)
  useEffect(() => {
    if (editing === null) form.setValue("idMaison", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCourSaisi]);

  function openCreate() {
    setEditing(null);
    form.reset({ dateDepense: aujourdhui(), nombreMois: 1, accordBailleur: false, accordMotif: "" });
    setFormOpen(true);
  }

  function openEdit(depense: DepenseResponse) {
    setEditing(depense);
    form.reset({
      idCour: depense.idCour,
      libelle: depense.libelle,
      categorie: depense.categorie,
      prestataire: depense.prestataire ?? "",
      description: depense.description ?? "",
      dateDepense: depense.dateDepense,
      montant: depense.montant,
      nombreMois: depense.nombreMois,
      accordBailleur: depense.accordBailleur,
      accordMotif: depense.accordMotif ?? "",
    });
    setFormOpen(true);
  }

  async function onSubmit(values: DepenseCreateFormValues) {
    if (depassePlafond && !values.accordBailleur) {
      form.setError("accordBailleur", { message: "Confirmez que le bailleur a donné son accord pour cette dépense" });
      return;
    }
    if (depassePlafond && !values.accordMotif?.trim()) {
      form.setError("accordMotif", { message: "Précisez qui a donné l'accord, quand et comment" });
      return;
    }
    const commun = {
      libelle: values.libelle,
      categorie: values.categorie,
      prestataire: values.prestataire?.trim() || undefined,
      description: values.description?.trim() || undefined,
      dateDepense: values.dateDepense,
      montant: values.montant,
      nombreMois: values.nombreMois,
      accordBailleur: depassePlafond ? true : (values.accordBailleur ?? false),
      accordMotif: depassePlafond ? values.accordMotif?.trim() : undefined,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.idDepense, body: commun });
        toast.success("Dépense modifiée.");
      } else {
        await createMutation.mutateAsync({ ...commun, idCour: values.idCour, idMaison: values.idMaison });
        toast.success("Dépense enregistrée. Elle sera retenue sur les prochains reversements calculés.");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  async function onAnnuler(values: AnnulerDepenseFormValues) {
    if (!cancelling) return;
    try {
      await annulerMutation.mutateAsync({ id: cancelling.idDepense, motif: values.motif });
      toast.success("Dépense annulée.");
      setCancelling(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Annulation impossible.");
    }
  }

  async function onAbandonner(values: AbandonnerDepenseFormValues) {
    if (!waiving) return;
    try {
      await abandonMutation.mutateAsync({ id: waiving.idDepense, motif: values.motif });
      toast.success("Créance abandonnée. La dépense est soldée et le bailleur en est informé.");
      setWaiving(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Abandon impossible.");
    }
  }

  async function onRetablir(values: AbandonnerDepenseFormValues) {
    if (!restoring) return;
    try {
      await retablirMutation.mutateAsync({ id: restoring.idDepense, motif: values.motif });
      toast.success("Créance rétablie : le montant redevient dû par le bailleur, qui en est informé.");
      setRestoring(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Rétablissement impossible.");
    }
  }

  async function onReechelonner(values: ReechelonnerDepenseFormValues) {
    if (!rescheduling) return;
    if (values.nombreMoisRestants === moisRestantsActuels) {
      reechelonnerForm.setError("nombreMoisRestants", { message: `Le solde est déjà étalé sur ${moisRestantsActuels} reversement(s)` });
      return;
    }
    if (values.nombreMoisRestants > rescheduling.montantRestant) {
      reechelonnerForm.setError("nombreMoisRestants", { message: "Le solde restant est trop faible pour cet étalement" });
      return;
    }
    if (raccourcit && !values.accordBailleur) {
      reechelonnerForm.setError("accordBailleur", { message: "Confirmez que le bailleur a donné son accord pour raccourcir l'étalement" });
      return;
    }
    try {
      await reechelonnerMutation.mutateAsync({
        id: rescheduling.idDepense,
        body: { nombreMoisRestants: values.nombreMoisRestants, motif: values.motif, accordBailleur: raccourcit ? true : undefined },
      });
      toast.success("Étalement modifié. Le bailleur en est informé.");
      setRescheduling(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Rééchelonnement impossible.");
    }
  }

  async function onReglement(values: ReglementDepenseFormValues) {
    if (!settling) return;
    if (values.montant > settling.montantRestant) {
      reglementForm.setError("montant", { message: `Le solde restant dû est de ${formatMontant(settling.montantRestant)}` });
      return;
    }
    try {
      const depense = await reglementMutation.mutateAsync({
        id: settling.idDepense,
        body: {
          montant: values.montant,
          dateReglement: values.dateReglement,
          modeReglement: values.modeReglement?.trim() || undefined,
          reference: values.reference?.trim() || undefined,
          commentaire: values.commentaire?.trim() || undefined,
        },
      });
      toast.success(depense.statut === "SOLDEE" ? "Règlement enregistré. La dépense est soldée." : "Règlement enregistré.");
      setSettling(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement du règlement impossible.");
    }
  }

  const columns: DataTableColumn<DepenseResponse>[] = [
    { key: "date", header: "Date", render: (d) => formatDate(d.dateDepense) },
    {
      key: "cour",
      header: "Cour et bailleur",
      render: (d) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          <span>
            <span className="whitespace-nowrap">{d.referenceCour}</span>
            <span className="block text-xs text-slate-500">
              {d.nomProprietaire}
              {d.nomMaison ? ` - ${d.nomMaison}` : ""}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "libelle",
      header: "Dépense",
      render: (d) => (
        <span>
          {d.libelle}
          <span className="block text-xs text-slate-500">{CATEGORIE_DEPENSE_LABELS[d.categorie]}</span>
        </span>
      ),
    },
    { key: "montant", header: "Montant", align: "right", render: (d) => formatMontant(d.montant) },
    { key: "etalement", header: "Retenue", render: (d) => retenueLabel(d) },
    {
      key: "retenu",
      header: "Déjà récupéré",
      align: "right",
      render: (d) => (
        <span>
          {formatMontant(d.montantImpute + d.montantRegle)}
          {d.montantRegle > 0 && <span className="block text-xs text-slate-500">dont {formatMontant(d.montantRegle)} en direct</span>}
          {d.montantAbandonne > 0 && <span className="block text-xs text-slate-500">{formatMontant(d.montantAbandonne)} abandonné</span>}
        </span>
      ),
    },
    { key: "reste", header: "Reste dû", align: "right", render: (d) => formatMontant(d.montantRestant) },
    {
      key: "statut",
      header: "Statut",
      render: (d) => (
        <span>
          <StatutBadge statut={d.statut} />
          {d.contestationOuverte && <span className="mt-1 block text-xs font-semibold text-amber-700">contestée par le bailleur</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => {
        const items: ActionGroupItem[] = [
          { label: "Voir le détail", text: "Détails", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setDetailId(d.idDepense) },
        ];
        if (nonEntamee(d)) {
          items.push({ label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(d) });
          items.push({
            label: "Annuler la dépense",
            text: "Annuler",
            icon: <Ban size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => {
              annulerForm.reset({ motif: "" });
              setCancelling(d);
            },
          });
        }
        if (d.statut === "EN_COURS") {
          items.push({
            label: "Rééchelonner le solde",
            text: "Étaler",
            icon: <CalendarClock size={15} aria-hidden="true" />,
            onClick: () => {
              reechelonnerForm.reset({ nombreMoisRestants: d.moisRestants ?? 1, motif: "", accordBailleur: false });
              setRescheduling(d);
            },
          });
        }
        if (isAdmin && d.montantAbandonne > 0) {
          items.push({
            label: "Rétablir la créance abandonnée",
            text: "Rétablir",
            icon: <Undo2 size={15} aria-hidden="true" />,
            onClick: () => {
              retablirForm.reset({ motif: "" });
              setRestoring(d);
            },
          });
        }
        if (d.statut === "A_REGLER") {
          items.push({
            label: "Enregistrer un règlement du bailleur",
            text: "Règlement",
            icon: <HandCoins size={15} aria-hidden="true" />,
            onClick: () => {
              reglementForm.reset({ montant: d.montantRestant, dateReglement: aujourdhui(), modeReglement: "", reference: "", commentaire: "" });
              setSettling(d);
            },
          });
          if (isAdmin) {
            items.push({
              label: "Abandonner le reste dû",
              text: "Abandon",
              icon: <Scale size={15} aria-hidden="true" />,
              tone: "danger",
              onClick: () => {
                abandonForm.reset({ motif: "" });
                setWaiving(d);
              },
            });
          }
        }
        return <ActionGroup items={items} />;
      },
    },
  ];

  const enregistrement = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Dépenses des bailleurs"
        description="Travaux et frais à la charge du bailleur, avancés par l'agence puis retenus sur ses reversements, en une fois ou étalés sur plusieurs mois. Après la résiliation d'un mandat, le solde est dû par le bailleur."
        actions={
          <Button variant="accent" icon={<Plus size={16} />} onClick={openCreate}>
            Nouvelle dépense
          </Button>
        }
      />

      {mandatsEchus.length > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {mandatsEchus.length === 1 ? "Un mandat est arrivé à terme" : `${mandatsEchus.length} mandats sont arrivés à terme`} alors que des dépenses sont
              encore en cours de retenue
            </span>
          </p>
          <ul className="mt-2 space-y-1 pl-6">
            {mandatsEchus.map((m) => (
              <li key={m.idMandat}>
                <Link to={`/espace-agent/mandats?cible=${m.idMandat}`} className="font-semibold underline">
                  {m.referenceCour}
                </Link>
                {" : "}fin le {formatDate(m.dateFin)}, {m.nombreDepenses} dépense{m.nombreDepenses > 1 ? "s" : ""}, {formatMontant(m.resteARetenir)} restant à retenir.
              </li>
            ))}
          </ul>
          <p className="mt-2 pl-6">Résiliez le mandat (le solde est alors retenu d&apos;un coup sur les derniers reversements) ou prolongez-le par avenant.</p>
        </div>
      )}

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} labels={LIBELLES_COMPTEURS} />

      {depensesQuery.isError ? (
        <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger les dépenses" description="Réessayez dans quelques instants." />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Dépense, cour, bailleur…"
              ariaLabel="Rechercher parmi les dépenses"
            />
            <div className="sm:w-48">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutDepense | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
            <div className="sm:w-80">
              <RemoteCombobox
                placeholder="Toutes les cours"
                useOptions={useCoursOptions}
                onChange={(e) => {
                  setIdCourFilter(e.target.value ? Number(e.target.value) : "");
                  setPage(0);
                }}
              />
            </div>
          </div>
          <DataTable
            data={depenses}
            columns={columns}
            keyExtractor={(d) => d.idDepense}
            loading={depensesQuery.isLoading}
            emptyMessage={
              statutFilter || idCourFilter !== "" || recherche ? "Aucune dépense ne correspond à votre recherche" : "Aucune dépense enregistrée pour le moment"
            }
          />
          {depensesQuery.data && (
            <Pagination
              currentPage={depensesQuery.data.page.number}
              totalPages={depensesQuery.data.page.totalPages}
              totalElements={depensesQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Modifier la dépense - ${editing.referenceCour}` : "Nouvelle dépense"}
        titleTone="indigo"
        size="lg"
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {editing === null && (
            <div className="grid gap-4 sm:grid-cols-2">
              <RemoteCombobox
                label="Cour"
                required
                placeholder="Rechercher une cour sous gestion"
                emptyText="Aucune cour sous mandat de gestion actif"
                useOptions={useCoursSousGestionOptions}
                value={form.watch("idCour")}
                error={form.formState.errors.idCour?.message}
                {...form.register("idCour")}
              />
              <Select
                label="Maison concernée"
                placeholder={idCourSaisi === undefined ? "Choisissez d'abord une cour" : "Toute la cour"}
                disabled={idCourSaisi === undefined}
                options={(maisonsQuery.data?.content ?? []).map((m) => ({ value: m.idMaison, label: m.nomCommunMaison ?? `Maison #${m.idMaison}` }))}
                {...form.register("idMaison")}
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Libellé"
              required
              placeholder="Ex. reprise de l'étanchéité du toit"
              error={form.formState.errors.libelle?.message}
              {...form.register("libelle")}
            />
            <Select
              label="Catégorie"
              required
              placeholder="Sélectionner"
              defaultValue=""
              options={CATEGORIES_DEPENSE.map((c) => ({ value: c, label: CATEGORIE_DEPENSE_LABELS[c] }))}
              error={form.formState.errors.categorie?.message}
              {...form.register("categorie")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Prestataire" placeholder="Artisan ou entreprise" error={form.formState.errors.prestataire?.message} {...form.register("prestataire")} />
            <Input
              label="Date de la dépense"
              type="date"
              required
              max={aujourdhui()}
              error={form.formState.errors.dateDepense?.message}
              {...form.register("dateDepense")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Montant" type="number" min={1} step="1" required error={form.formState.errors.montant?.message} {...form.register("montant")} />
            <Input
              label="Retenir sur (nombre de reversements)"
              type="number"
              min={1}
              max={60}
              step="1"
              required
              readOnly={issueDunDevis}
              helperText={
                issueDunDevis
                  ? "Étalement accepté par le bailleur avec le devis : non modifiable."
                  : nombreMoisSaisi > 1 && montantSaisi > 0
                    ? `Environ ${formatMontant(Math.round(montantSaisi / nombreMoisSaisi))} retenus par reversement.`
                    : "1 = retenue en une seule fois."
              }
              error={form.formState.errors.nombreMois?.message}
              {...form.register("nombreMois")}
            />
          </div>
          <Textarea label="Description" rows={2} placeholder="Détail des travaux (facultatif)" {...form.register("description")} />

          {idCourSaisi !== undefined && mandatQuery.data && !mandat && (
            <p className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Cette cour n&apos;a plus de mandat de gestion actif : la dépense ne pourrait pas être retenue sur des reversements.</span>
            </p>
          )}

          {issueDunDevis && editing && (
            <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Dépense issue d&apos;un devis accepté par le bailleur : le montant ne peut pas dépasser celui du devis.</span>
            </p>
          )}

          {mandat && !issueDunDevis && (
            <div className={`space-y-3 rounded-xl border p-4 ${depassePlafond ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-slate-50"}`}>
              <p className={`flex items-start gap-2 text-sm ${depassePlafond ? "text-amber-900" : "text-slate-600"}`}>
                <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  {plafond === null
                    ? "Le mandat ne fixe aucun plafond : la dépense peut être engagée sans accord préalable du bailleur."
                    : depassePlafond
                      ? `Cette dépense dépasse le plafond convenu dans le mandat (${formatMontant(plafond)}) : l'accord du bailleur est nécessaire, attesté ici ou obtenu par un devis soumis depuis la page Devis de travaux.`
                      : `Plafond des dépenses sans accord préalable convenu dans le mandat : ${formatMontant(plafond)}.`}{" "}
                  Si le net d&apos;un reversement ne suffit pas, le reste est reporté sur le reversement suivant.
                </span>
              </p>
              {depassePlafond && (
                <div>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" {...form.register("accordBailleur")} />
                    <span>Le bailleur a donné son accord pour cette dépense</span>
                  </label>
                  {form.formState.errors.accordBailleur && (
                    <p role="alert" className="mt-1 text-xs text-danger-600">
                      {form.formState.errors.accordBailleur.message}
                    </p>
                  )}
                  <div className="mt-3">
                    <Textarea
                      label="Qui a donné l'accord, quand et comment"
                      required
                      rows={2}
                      placeholder="Ex. M. Ouédraogo, par téléphone, le 12/11"
                      helperText="Cette mention est visible du bailleur, qui est prévenu de la dépense."
                      error={form.formState.errors.accordMotif?.message}
                      {...form.register("accordMotif")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Button type="submit" fullWidth loading={enregistrement}>
            {editing ? "Enregistrer" : "Enregistrer la dépense"}
          </Button>
        </form>
      </Modal>

      <DepenseDetailModal idDepense={detailId} onClose={() => setDetailId(null)} vue="agent" />

      <Modal isOpen={rescheduling !== null} onClose={() => setRescheduling(null)} title="Rééchelonner le solde" titleTone="indigo">
        {rescheduling && (
          <form className="space-y-4" onSubmit={reechelonnerForm.handleSubmit(onReechelonner)} noValidate>
            <p className="text-sm text-slate-600">
              Il reste <strong>{formatMontant(rescheduling.montantRestant)}</strong> à retenir pour <strong>{rescheduling.libelle}</strong> (
              {rescheduling.referenceCour}), aujourd&apos;hui sur {moisRestantsActuels} reversement{moisRestantsActuels > 1 ? "s" : ""}. Les retenues déjà
              faites ne changent pas.
            </p>
            <Input
              label="Retenir le solde sur (nombre de reversements)"
              type="number"
              min={1}
              max={60}
              step="1"
              required
              helperText={
                nouveauxMois >= 1
                  ? `Environ ${formatMontant(Math.round(rescheduling.montantRestant / nouveauxMois))} retenus par reversement.`
                  : undefined
              }
              error={reechelonnerForm.formState.errors.nombreMoisRestants?.message}
              {...reechelonnerForm.register("nombreMoisRestants")}
            />
            <Textarea
              label="Motif"
              required
              rows={2}
              placeholder="Ex. demande du bailleur, loyers en baisse"
              error={reechelonnerForm.formState.errors.motif?.message}
              {...reechelonnerForm.register("motif")}
            />
            {raccourcit && (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="flex items-start gap-2 text-sm text-amber-900">
                  <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Raccourcir l&apos;étalement augmente les retenues sur les prochains reversements : l&apos;accord du bailleur est nécessaire.</span>
                </p>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" {...reechelonnerForm.register("accordBailleur")} />
                  <span>Le bailleur a donné son accord pour ce nouvel étalement</span>
                </label>
                {reechelonnerForm.formState.errors.accordBailleur && (
                  <p role="alert" className="text-xs text-danger-600">
                    {reechelonnerForm.formState.errors.accordBailleur.message}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setRescheduling(null)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1" loading={reechelonnerMutation.isPending}>
                Rééchelonner
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={settling !== null} onClose={() => setSettling(null)} title="Règlement direct du bailleur" titleTone="indigo">
        {settling && (
          <form className="space-y-4" onSubmit={reglementForm.handleSubmit(onReglement)} noValidate>
            <p className="text-sm text-slate-600">
              Le mandat de <strong>{settling.referenceCour}</strong> est résilié : {settling.nomProprietaire} doit encore{" "}
              <strong>{formatMontant(settling.montantRestant)}</strong> pour <strong>{settling.libelle}</strong>. Enregistrez ici ce qu&apos;il a réglé
              directement à l&apos;agence, en une ou plusieurs fois.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Montant réglé"
                type="number"
                min={1}
                max={settling.montantRestant}
                step="1"
                required
                error={reglementForm.formState.errors.montant?.message}
                {...reglementForm.register("montant")}
              />
              <Input
                label="Date du règlement"
                type="date"
                required
                max={aujourdhui()}
                error={reglementForm.formState.errors.dateReglement?.message}
                {...reglementForm.register("dateReglement")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Mode de règlement"
                placeholder="Espèces, virement, mobile money"
                error={reglementForm.formState.errors.modeReglement?.message}
                {...reglementForm.register("modeReglement")}
              />
              <Input
                label="Référence"
                placeholder="Numéro de reçu ou de transaction"
                error={reglementForm.formState.errors.reference?.message}
                {...reglementForm.register("reference")}
              />
            </div>
            <Textarea label="Commentaire" rows={2} error={reglementForm.formState.errors.commentaire?.message} {...reglementForm.register("commentaire")} />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setSettling(null)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1" loading={reglementMutation.isPending}>
                Enregistrer le règlement
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={restoring !== null} onClose={() => setRestoring(null)} title="Rétablir la créance ?" titleTone="indigo">
        {restoring && (
          <form className="space-y-4" onSubmit={retablirForm.handleSubmit(onRetablir)} noValidate>
            <p className="text-sm text-slate-600">
              Les <strong>{formatMontant(restoring.montantAbandonne)}</strong> abandonnés sur <strong>{restoring.libelle}</strong> ({restoring.referenceCour})
              redeviennent dus par {restoring.nomProprietaire}. L&apos;abandon reste visible dans l&apos;historique de la dépense et le bailleur en est informé.
            </p>
            <Textarea
              label="Motif du rétablissement"
              required
              rows={2}
              placeholder="Ex. abandon saisi par erreur, le bailleur accepte de payer"
              error={retablirForm.formState.errors.motif?.message}
              {...retablirForm.register("motif")}
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setRestoring(null)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1" loading={retablirMutation.isPending}>
                Rétablir la créance
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={waiving !== null} onClose={() => setWaiving(null)} title="Abandonner le reste dû ?" titleTone="indigo">
        {waiving && (
          <form className="space-y-4" onSubmit={abandonForm.handleSubmit(onAbandonner)} noValidate>
            <p className="text-sm text-slate-600">
              L&apos;agence renonce à réclamer <strong>{formatMontant(waiving.montantRestant)}</strong> à {waiving.nomProprietaire} pour{" "}
              <strong>{waiving.libelle}</strong> ({waiving.referenceCour}). La dépense est soldée, mais cette perte reste tracée dans le détail de la dépense
              et dans le rapport mensuel. Le bailleur en est informé.
            </p>
            <Textarea
              label="Motif de l'abandon"
              required
              rows={2}
              placeholder="Ex. bailleur introuvable, litige réglé à l'amiable, reste dérisoire"
              error={abandonForm.formState.errors.motif?.message}
              {...abandonForm.register("motif")}
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setWaiving(null)}>
                Retour
              </Button>
              <Button type="submit" variant="danger" className="flex-1" loading={abandonMutation.isPending}>
                Abandonner la créance
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={cancelling !== null} onClose={() => setCancelling(null)} title="Annuler cette dépense ?" titleTone="indigo">
        {cancelling && (
          <form className="space-y-4" onSubmit={annulerForm.handleSubmit(onAnnuler)} noValidate>
            <p className="text-sm text-slate-600">
              La dépense <strong>{cancelling.libelle}</strong> de {formatMontant(cancelling.montant)} sur <strong>{cancelling.referenceCour}</strong> ne sera
              pas retenue sur les reversements. Le bailleur en est informé.
            </p>
            <Textarea label="Motif de l'annulation" required rows={2} error={annulerForm.formState.errors.motif?.message} {...annulerForm.register("motif")} />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setCancelling(null)}>
                Retour
              </Button>
              <Button type="submit" variant="danger" className="flex-1" loading={annulerMutation.isPending}>
                Annuler la dépense
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
