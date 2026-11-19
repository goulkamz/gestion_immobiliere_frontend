import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Ban, Building2, Edit2, Eye, FileText, Info, PhoneCall, Plus, Wrench } from "lucide-react";
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
import { DevisFiche } from "@/components/ui/DevisFiche";
import { devisApi } from "@/api/devis";
import { ApiError } from "@/api/http";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import { useCoursOptions, useCoursSousGestionOptions } from "@/hooks/useOptionsSelection";
import { useMaisonsGestionQuery } from "@/hooks/queries/useMaisons";
import {
  useAccordHorsPlateformeMutation,
  useAnnulerDevisMutation,
  useCreateDevisMutation,
  useDevisQuery,
  useEnregistrerDepenseDevisMutation,
  useJoindrePieceJointeMutation,
  useRetirerPieceJointeMutation,
  useUpdateDevisMutation,
} from "@/hooks/queries/useDevis";
import {
  accordHorsPlateformeSchema,
  depenseDepuisDevisSchema,
  devisCreateSchema,
  retirerDevisSchema,
  type AccordHorsPlateformeFormInput,
  type AccordHorsPlateformeFormValues,
  type DepenseDepuisDevisFormInput,
  type DepenseDepuisDevisFormValues,
  type DevisCreateFormInput,
  type DevisCreateFormValues,
  type RetirerDevisFormInput,
  type RetirerDevisFormValues,
} from "../schemas";
import { CATEGORIE_DEPENSE_LABELS, CATEGORIES_DEPENSE, etalementLabel } from "@/utils/depense";
import { DEVIS_STATUT_LABELS, STATUTS_DEVIS } from "@/utils/devis";
import { formatDate, formatMontant } from "@/utils/format";
import type { DevisResponse, StatutDevis } from "@/api/types";

// Compteurs : ce qui demande une action de l'agence ou attend le bailleur (les statuts clos restent dans le filtre)
const STATUTS_COMPTEURS = ["EN_ATTENTE", "A_RENEGOCIER", "ACCEPTE", "REALISE"] as const;
const LIBELLES_COMPTEURS: Partial<Record<StatutDevis, string>> = {
  EN_ATTENTE: "En attente",
  A_RENEGOCIER: "À renégocier",
  ACCEPTE: "Acceptés",
  REALISE: "Réalisés",
};

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Modifiable tant que le bailleur n'a pas tranché ; après une demande de renégociation ou une expiration, modifier = soumettre à nouveau. */
function modifiable(d: DevisResponse): boolean {
  return d.statut === "EN_ATTENTE" || d.statut === "A_RENEGOCIER" || d.statut === "EXPIRE";
}

/** Modifier ce devis le renvoie au bailleur (nouvelle soumission, nouveau délai de réponse). */
function aResoumettre(d: DevisResponse): boolean {
  return d.statut === "A_RENEGOCIER" || d.statut === "EXPIRE";
}

const TAILLE_MAX_PDF = 10 * 1024 * 1024;

/** Le devis PDF de l'artisan : un fichier PDF de 10 Mo au plus (le serveur vérifie aussi son contenu). */
function erreurFichierPdf(fichier: File): string | null {
  if (fichier.type !== "application/pdf" && !fichier.name.toLowerCase().endsWith(".pdf")) return "Le devis joint doit être un fichier PDF.";
  if (fichier.size > TAILLE_MAX_PDF) return "Le fichier dépasse 10 Mo.";
  return null;
}

export function AgentDevisPage() {
  const [statutFilter, setStatutFilter] = useState<StatutDevis | "">("");
  const [idCourFilter, setIdCourFilter] = useState<number | "">("");
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DevisResponse | null>(null);
  const [detail, setDetail] = useState<DevisResponse | null>(null);
  const [retrait, setRetrait] = useState<DevisResponse | null>(null);
  const [aRealiser, setARealiser] = useState<DevisResponse | null>(null);
  const [accordPour, setAccordPour] = useState<DevisResponse | null>(null);
  // Devis PDF de l'artisan choisi dans le formulaire (envoyé après l'enregistrement du devis) ; retrait demandé en modification
  const [fichierPdf, setFichierPdf] = useState<File | null>(null);
  const [erreurPdf, setErreurPdf] = useState<string | null>(null);
  const [retirerPdf, setRetirerPdf] = useState(false);
  const champPdf = useRef<HTMLInputElement>(null);

  const filtres = { idCour: idCourFilter === "" ? undefined : idCourFilter, recherche: recherche || undefined };
  const devisQuery = useDevisQuery({ ...filtres, statut: statutFilter || undefined, page, size: 20, sort: "createdAt,desc" });
  const compteurs = useCompteursStatut(useDevisQuery, filtres, STATUTS_COMPTEURS);

  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: devisQuery.data?.content ?? [],
    getId: (d) => d.idDevis,
    fetchOne: devisApi.get,
    queryKey: ["devis"],
  });

  const createMutation = useCreateDevisMutation();
  const updateMutation = useUpdateDevisMutation();
  const annulerMutation = useAnnulerDevisMutation();
  const depenseMutation = useEnregistrerDepenseDevisMutation();
  const accordMutation = useAccordHorsPlateformeMutation();
  const joindreMutation = useJoindrePieceJointeMutation();
  const retirerPieceMutation = useRetirerPieceJointeMutation();

  const accordForm = useForm<AccordHorsPlateformeFormInput, unknown, AccordHorsPlateformeFormValues>({
    resolver: zodResolver(accordHorsPlateformeSchema),
  });
  const form = useForm<DevisCreateFormInput, unknown, DevisCreateFormValues>({ resolver: zodResolver(devisCreateSchema) });
  const retraitForm = useForm<RetirerDevisFormInput, unknown, RetirerDevisFormValues>({ resolver: zodResolver(retirerDevisSchema) });
  const depenseForm = useForm<DepenseDepuisDevisFormInput, unknown, DepenseDepuisDevisFormValues>({ resolver: zodResolver(depenseDepuisDevisSchema) });

  const idCourSaisi = Number(form.watch("idCour")) || undefined;
  const montantSaisi = Number(form.watch("montant")) || 0;
  const nombreMoisSaisi = Number(form.watch("nombreMois")) || 1;
  const maisonsQuery = useMaisonsGestionQuery(
    { idCour: idCourSaisi, size: 100, sort: "nomCommunMaison,asc" },
    { enabled: formOpen && editing === null && idCourSaisi !== undefined },
  );

  // La maison dépend de la cour : on la vide quand la cour change (création seulement)
  useEffect(() => {
    if (editing === null) form.setValue("idMaison", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCourSaisi]);

  function reinitialiserPdf() {
    setFichierPdf(null);
    setErreurPdf(null);
    setRetirerPdf(false);
    if (champPdf.current) champPdf.current.value = "";
  }

  function choisirPdf(fichier: File | undefined) {
    if (!fichier) {
      reinitialiserPdf();
      return;
    }
    const erreur = erreurFichierPdf(fichier);
    setErreurPdf(erreur);
    setFichierPdf(erreur ? null : fichier);
    setRetirerPdf(false);
  }

  function openCreate() {
    setEditing(null);
    reinitialiserPdf();
    form.reset({ nombreMois: 1 });
    setFormOpen(true);
  }

  function openEdit(devis: DevisResponse) {
    setEditing(devis);
    reinitialiserPdf();
    form.reset({
      idCour: devis.idCour,
      libelle: devis.libelle,
      categorie: devis.categorie,
      prestataire: devis.prestataire ?? "",
      description: devis.description ?? "",
      montant: devis.montant,
      nombreMois: devis.nombreMois,
    });
    setFormOpen(true);
  }

  async function onSubmit(values: DevisCreateFormValues) {
    // Un fichier refusé (pas un PDF, trop gros) bloque l'envoi : mieux vaut le corriger que soumettre sans document sans le savoir
    if (erreurPdf) return;
    const commun = {
      libelle: values.libelle,
      categorie: values.categorie,
      prestataire: values.prestataire?.trim() || undefined,
      description: values.description?.trim() || undefined,
      montant: values.montant,
      nombreMois: values.nombreMois,
    };
    let idDevis: number;
    try {
      if (editing) {
        // Le PDF est mis à jour avant la soumission : le bailleur le trouve déjà joint quand il est prévenu
        idDevis = editing.idDevis;
        if (retirerPdf && editing.pieceJointe) await retirerPieceMutation.mutateAsync(idDevis);
        if (fichierPdf) await joindreMutation.mutateAsync({ id: idDevis, fichier: fichierPdf });
        await updateMutation.mutateAsync({ id: idDevis, body: commun });
        toast.success(aResoumettre(editing) ? "Devis soumis à nouveau au bailleur." : "Devis modifié.");
      } else {
        const cree = await createMutation.mutateAsync({ ...commun, idCour: values.idCour, idMaison: values.idMaison });
        idDevis = cree.idDevis;
        toast.success("Devis soumis au bailleur. Vous serez prévenu de sa réponse.");
        if (fichierPdf) {
          try {
            await joindreMutation.mutateAsync({ id: idDevis, fichier: fichierPdf });
          } catch (err) {
            toast.warning(err instanceof ApiError ? `Le devis est soumis, mais le PDF n'a pas pu être joint : ${err.message}` : "Le devis est soumis, mais le PDF n'a pas pu être joint.");
          }
        }
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  async function onAccordHorsPlateforme(values: AccordHorsPlateformeFormValues) {
    if (!accordPour) return;
    try {
      await accordMutation.mutateAsync({ id: accordPour.idDevis, body: { motif: values.motif, dateAccord: values.dateAccord } });
      toast.success("Accord enregistré. Le bailleur en est informé et peut le contester tant que la dépense n'est pas enregistrée.");
      setAccordPour(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement de l'accord impossible.");
    }
  }

  async function onRetirer(values: RetirerDevisFormValues) {
    if (!retrait) return;
    try {
      await annulerMutation.mutateAsync({ id: retrait.idDevis, commentaire: values.commentaire });
      toast.success("Devis retiré.");
      setRetrait(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Retrait impossible.");
    }
  }

  async function onEnregistrerDepense(values: DepenseDepuisDevisFormValues) {
    if (!aRealiser) return;
    if (values.montant > aRealiser.montant) {
      depenseForm.setError("montant", { message: `Au plus ${formatMontant(aRealiser.montant)} : c'est le montant accepté par le bailleur` });
      return;
    }
    try {
      await depenseMutation.mutateAsync({ id: aRealiser.idDevis, body: { dateDepense: values.dateDepense, montant: values.montant } });
      toast.success("Dépense enregistrée. Elle sera retenue sur les prochains reversements calculés.");
      setARealiser(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  const columns: DataTableColumn<DevisResponse>[] = [
    {
      key: "date",
      header: "Soumis le",
      render: (d) => (
        <span>
          {formatDate(d.dateSoumission)}
          {d.statut === "EN_ATTENTE" && d.dateLimiteReponse && (
            <span className="block text-xs text-slate-500">expire le {formatDate(d.dateLimiteReponse)}</span>
          )}
        </span>
      ),
    },
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
      header: "Travaux",
      render: (d) => (
        <span>
          {d.libelle}
          <span className="block text-xs text-slate-500">
            {CATEGORIE_DEPENSE_LABELS[d.categorie]}
            {d.prestataire ? ` - ${d.prestataire}` : ""}
          </span>
        </span>
      ),
    },
    { key: "montant", header: "Montant", align: "right", render: (d) => formatMontant(d.montant) },
    { key: "etalement", header: "Retenue proposée", render: (d) => etalementLabel(d) },
    {
      key: "statut",
      header: "Statut",
      render: (d) => (
        <span>
          <StatutBadge statut={d.statut} label={DEVIS_STATUT_LABELS[d.statut]} />
          {d.accordHorsPlateforme && d.statut === "ACCEPTE" && <span className="mt-1 block text-xs text-slate-500">accord hors plateforme</span>}
          {d.pieceJointe && <span className="mt-1 block text-xs text-slate-500">devis PDF joint</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => {
        const items: ActionGroupItem[] = [
          { label: "Voir le détail", text: "Détails", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setDetail(d) },
        ];
        if (d.statut === "ACCEPTE") {
          items.push({
            label: "Enregistrer la dépense",
            text: "Dépense",
            icon: <Wrench size={15} aria-hidden="true" />,
            onClick: () => {
              depenseForm.reset({ dateDepense: aujourdhui(), montant: d.montant });
              setARealiser(d);
            },
          });
        }
        if (modifiable(d)) {
          items.push({
            label: d.statut === "A_RENEGOCIER" ? "Réviser et soumettre à nouveau" : d.statut === "EXPIRE" ? "Soumettre à nouveau" : "Modifier",
            text: d.statut === "A_RENEGOCIER" ? "Réviser" : d.statut === "EXPIRE" ? "Relancer" : "Modifier",
            icon: <Edit2 size={15} aria-hidden="true" />,
            onClick: () => openEdit(d),
          });
        }
        if (modifiable(d)) {
          items.push({
            label: "Enregistrer l'accord donné par le bailleur hors plateforme",
            text: "Accord reçu",
            icon: <PhoneCall size={15} aria-hidden="true" />,
            onClick: () => {
              accordForm.reset({ motif: "", dateAccord: aujourdhui() });
              setAccordPour(d);
            },
          });
        }
        if (modifiable(d) || d.statut === "ACCEPTE") {
          items.push({
            label: "Retirer le devis",
            text: "Retirer",
            icon: <Ban size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => {
              retraitForm.reset({ commentaire: "" });
              setRetrait(d);
            },
          });
        }
        return <ActionGroup items={items} />;
      },
    },
  ];

  const revision = editing?.statut === "A_RENEGOCIER";
  const expire = editing?.statut === "EXPIRE";
  const enregistrement = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Devis de travaux"
        description="Travaux proposés aux bailleurs avant d'engager la dépense : le bailleur accepte, demande une renégociation ou rejette. Sans réponse dans le délai, le devis expire et peut être soumis à nouveau. Un devis accepté s'enregistre ensuite en dépense, retenue sur ses reversements."
        actions={
          <Button variant="accent" icon={<Plus size={16} />} onClick={openCreate}>
            Nouveau devis
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS_COMPTEURS} labels={LIBELLES_COMPTEURS} />

      {devisQuery.isError ? (
        <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger les devis" description="Réessayez dans quelques instants." />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <SearchInput value={search} onChange={setSearch} placeholder="Devis, cour, bailleur…" ariaLabel="Rechercher parmi les devis" />
            <div className="sm:w-56">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutDevis | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS_DEVIS.map((s) => ({ value: s, label: DEVIS_STATUT_LABELS[s] }))}
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
            data={lignes}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(d) => d.idDevis}
            loading={devisQuery.isLoading}
            emptyMessage={statutFilter || idCourFilter !== "" || recherche ? "Aucun devis ne correspond à votre recherche" : "Aucun devis soumis pour le moment"}
          />
          {devisQuery.data && (
            <Pagination
              currentPage={devisQuery.data.page.number}
              totalPages={devisQuery.data.page.totalPages}
              totalElements={devisQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `${revision ? "Réviser" : expire ? "Soumettre à nouveau" : "Modifier"} le devis - ${editing.referenceCour}` : "Nouveau devis"}
        titleTone="indigo"
        size="lg"
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {revision && editing?.commentaireBailleur && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-semibold">Demande du bailleur :</span> {editing.commentaireBailleur}
              </span>
            </p>
          )}
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
              label="Travaux à réaliser"
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
          <Input label="Prestataire" placeholder="Artisan ou entreprise qui a établi le devis" error={form.formState.errors.prestataire?.message} {...form.register("prestataire")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Montant du devis" type="number" min={1} step="1" required error={form.formState.errors.montant?.message} {...form.register("montant")} />
            <Input
              label="Retenue proposée (nombre de reversements)"
              type="number"
              min={1}
              max={60}
              step="1"
              required
              helperText={
                nombreMoisSaisi > 1 && montantSaisi > 0
                  ? `Environ ${formatMontant(Math.round(montantSaisi / nombreMoisSaisi))} retenus par reversement.`
                  : "1 = retenue en une seule fois."
              }
              error={form.formState.errors.nombreMois?.message}
              {...form.register("nombreMois")}
            />
          </div>
          <Textarea
            label="Description"
            rows={3}
            placeholder="Nature des travaux, détail du chiffrage, délai annoncé (facultatif)"
            {...form.register("description")}
          />
          <div>
            <label htmlFor="devis-pdf" className="mb-1.5 block text-sm font-medium text-slate-700">
              Devis de l&apos;artisan (PDF, facultatif)
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              <FileText size={16} className="shrink-0 text-primary-600" aria-hidden="true" />
              <input
                id="devis-pdf"
                ref={champPdf}
                type="file"
                accept="application/pdf,.pdf"
                className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                onChange={(e) => choisirPdf(e.target.files?.[0])}
              />
            </div>
            {editing?.pieceJointe && !fichierPdf && (
              <label className="mt-2 flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={retirerPdf}
                  onChange={(e) => setRetirerPdf(e.target.checked)}
                />
                <span>Un devis PDF est déjà joint : retirer ce document (ou en choisir un autre ci-dessus pour le remplacer)</span>
              </label>
            )}
            {erreurPdf ? (
              <p role="alert" className="mt-1 text-xs text-danger-600">
                {erreurPdf}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Le bailleur peut le consulter avant de répondre. 10 Mo au plus.</p>
            )}
          </div>
          <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {revision
                ? "Le devis révisé est soumis à nouveau au bailleur, qui en est prévenu."
                : expire
                  ? "Ce devis a expiré sans réponse du bailleur. En l'enregistrant, même sans le changer, il lui est soumis à nouveau avec un nouveau délai de réponse."
                  : "Le bailleur est prévenu et répond depuis son espace. Aucune dépense n'est engagée tant qu'il n'a pas accepté."}
            </span>
          </p>
          <Button type="submit" fullWidth loading={enregistrement}>
            {editing ? (revision ? "Soumettre le devis révisé" : expire ? "Soumettre à nouveau" : "Enregistrer") : "Soumettre au bailleur"}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={accordPour !== null} onClose={() => setAccordPour(null)} title="Accord donné hors plateforme" titleTone="indigo">
        {accordPour && (
          <form className="space-y-4" onSubmit={accordForm.handleSubmit(onAccordHorsPlateforme)} noValidate>
            <p className="text-sm text-slate-600">
              Le bailleur de <strong>{accordPour.referenceCour}</strong> vous a donné son accord pour <strong>{accordPour.libelle}</strong> (
              {formatMontant(accordPour.montant)}) en dehors de la plateforme. Le devis passe à « accepté ». Le bailleur est prévenu et peut contester cet
              accord tant que la dépense n&apos;est pas enregistrée.
            </p>
            <Input
              label="Date de l'accord"
              type="date"
              required
              max={aujourdhui()}
              error={accordForm.formState.errors.dateAccord?.message}
              {...accordForm.register("dateAccord")}
            />
            <Textarea
              label="Qui a donné l'accord et comment"
              required
              rows={3}
              placeholder="Ex. M. Ouédraogo, par téléphone, après lecture du devis de l'artisan"
              error={accordForm.formState.errors.motif?.message}
              {...accordForm.register("motif")}
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setAccordPour(null)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1" loading={accordMutation.isPending}>
                Enregistrer l&apos;accord
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={detail !== null} onClose={() => setDetail(null)} title={detail?.libelle ?? "Devis"} titleTone="indigo" size="lg">
        {detail && <DevisFiche devis={detail} vue="agent" />}
      </Modal>

      <Modal isOpen={aRealiser !== null} onClose={() => setARealiser(null)} title="Enregistrer la dépense" titleTone="indigo">
        {aRealiser && (
          <form className="space-y-4" onSubmit={depenseForm.handleSubmit(onEnregistrerDepense)} noValidate>
            <p className="text-sm text-slate-600">
              Le bailleur a accepté le devis <strong>{aRealiser.libelle}</strong> sur <strong>{aRealiser.referenceCour}</strong> pour{" "}
              {formatMontant(aRealiser.montant)} (retenue : {etalementLabel(aRealiser)}). Indiquez le montant réellement payé s&apos;il est inférieur.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Date de la dépense"
                type="date"
                required
                max={aujourdhui()}
                error={depenseForm.formState.errors.dateDepense?.message}
                {...depenseForm.register("dateDepense")}
              />
              <Input
                label="Montant payé"
                type="number"
                min={1}
                max={aRealiser.montant}
                step="1"
                required
                helperText={`Au plus ${formatMontant(aRealiser.montant)}.`}
                error={depenseForm.formState.errors.montant?.message}
                {...depenseForm.register("montant")}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setARealiser(null)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1" loading={depenseMutation.isPending}>
                Enregistrer la dépense
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={retrait !== null} onClose={() => setRetrait(null)} title="Retirer ce devis ?" titleTone="indigo">
        {retrait && (
          <form className="space-y-4" onSubmit={retraitForm.handleSubmit(onRetirer)} noValidate>
            <p className="text-sm text-slate-600">
              Le devis <strong>{retrait.libelle}</strong> de {formatMontant(retrait.montant)} sur <strong>{retrait.referenceCour}</strong> est clos : aucune
              dépense ne pourra en être tirée. Le bailleur en est informé.
            </p>
            <Textarea label="Motif du retrait" required rows={2} error={retraitForm.formState.errors.commentaire?.message} {...retraitForm.register("commentaire")} />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setRetrait(null)}>
                Retour
              </Button>
              <Button type="submit" variant="danger" className="flex-1" loading={annulerMutation.isPending}>
                Retirer le devis
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
