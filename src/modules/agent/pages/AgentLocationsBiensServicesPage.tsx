import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Eye,
  Flag,
  Mail,
  Package,
  Phone,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import {
  ActionGroup,
  BienServiceDetailModal,
  Button,
  DataTable,
  EmptyState,
  EntityPhotoPreview,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  RemoteCombobox,
  Select,
  StatutBadge,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import {
  useAnnulerLocationMutation,
  useConfirmerLocationMutation,
  useCreateLocationMutation,
  useLocationRemboursementsQuery,
  useLocationsQuery,
  useModifierDureeLocationMutation,
  useRembourserLocationMutation,
  useUpdateStatutLocationMutation,
} from "@/hooks/queries/useLocations";
import {
  useBiensServicesDisponiblesOptions,
  useClientsOptions,
} from "@/hooks/useOptionsSelection";
import {
  confirmerLocationSchema,
  locationPourClientSchema,
  modifierDureeLocationSchema,
  rembourserLocationSchema,
  type ConfirmerLocationFormInput,
  type ConfirmerLocationFormValues,
  type LocationPourClientFormInput,
  type LocationPourClientFormValues,
  type ModifierDureeLocationFormInput,
  type ModifierDureeLocationFormValues,
  type RembourserLocationFormInput,
  type RembourserLocationFormValues,
} from "../schemas";
import { formatDate, formatDateTime, formatMontant } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import { locationsApi } from "@/api/locations";
import { ApiError } from "@/api/http";
import type {
  LocationBienServiceResponse,
  StatutLocationBienService,
} from "@/api/types";

const STATUTS: StatutLocationBienService[] = [
  "EN_ATTENTE",
  "ACTIF",
  "TERMINE",
  "ANNULE",
];

// Les dates sont stockées en LocalDateTime ; les champs date n'attendent que yyyy-MM-dd
const versChampDate = (iso: string) => iso.slice(0, 10);

// Doit rester aligné avec JOURS_PREAVIS_ECHEANCE côté serveur
const JOURS_PREAVIS_ECHEANCE = 2;

/** Jours restants avant la fin (négatif si échue), calculés sur les dates sans heure. */
function joursAvantFin(dateFin: string): number {
  const fin = new Date(versChampDate(dateFin)).getTime();
  const aujourdhui = new Date(new Date().toISOString().slice(0, 10)).getTime();
  return Math.round((fin - aujourdhui) / 86400000);
}

function EcheanceBadge({ location }: { location: LocationBienServiceResponse }) {
  if (location.statut !== "ACTIF") return null;
  const jours = joursAvantFin(location.dateFin);
  if (jours > JOURS_PREAVIS_ECHEANCE) return null;
  let libelle: string;
  let couleur: string;
  if (jours < 0) {
    libelle = `Échue depuis ${-jours} jour(s)`;
    couleur = "bg-red-500";
  } else if (jours === 0) {
    libelle = "Se termine aujourd'hui";
    couleur = "bg-orange-500";
  } else {
    libelle = `Se termine dans ${jours} jour(s)`;
    couleur = "bg-amber-400";
  }
  // Pastille compacte : l'info s'affiche au survol (souris) ou au toucher/focus (mobile)
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={libelle}
        className="flex h-4 w-4 items-center justify-center rounded-full"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${couleur}`} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {libelle}
      </span>
    </span>
  );
}

function libelleSolde(solde: number) {
  if (solde > 0) return "Reste à payer";
  if (solde < 0) return "Trop-perçu à rembourser";
  return "Compte soldé";
}

export function AgentLocationsBiensServicesPage() {
  const [detailBien, setDetailBien] = useState<number | null>(null);
  const [creationOuverte, setCreationOuverte] = useState(false);
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<
    StatutLocationBienService | ""
  >("");
  const [aEcheance, setAEcheance] = useState(false);
  const [annulant, setAnnulant] = useState<LocationBienServiceResponse | null>(
    null,
  );
  const [confirmant, setConfirmant] =
    useState<LocationBienServiceResponse | null>(null);
  const [detail, setDetail] = useState<LocationBienServiceResponse | null>(
    null,
  );
  const [modifiant, setModifiant] = useState<LocationBienServiceResponse | null>(
    null,
  );
  const [remboursant, setRemboursant] =
    useState<LocationBienServiceResponse | null>(null);
  const [cloturant, setCloturant] = useState<LocationBienServiceResponse | null>(
    null,
  );

  // Filtre statut, recherche et pagination sont appliqués côté serveur
  const locationsQuery = useLocationsQuery({
    page,
    size: 20,
    sort: "dateDebut,desc",
    statut: statutFilter || undefined,
    aEcheance: aEcheance || undefined,
    recherche: recherche || undefined,
  });
  const compteurs = useCompteursStatut(useLocationsQuery, { aEcheance: aEcheance || undefined, recherche: recherche || undefined }, STATUTS);
  const locations = locationsQuery.data?.content ?? [];
  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: locations,
    getId: (l) => l.idLocationBienService,
    fetchOne: locationsApi.getLocation,
    queryKey: ["locations"],
  });
  const remboursementsQuery = useLocationRemboursementsQuery(
    detail?.idLocationBienService ?? 0,
  );
  const createMutation = useCreateLocationMutation();
  const confirmerMutation = useConfirmerLocationMutation();
  const annulerMutation = useAnnulerLocationMutation();
  const modifierDureeMutation = useModifierDureeLocationMutation();
  const rembourserMutation = useRembourserLocationMutation();
  const statutMutation = useUpdateStatutLocationMutation();

  const creationForm = useForm<
    LocationPourClientFormInput,
    unknown,
    LocationPourClientFormValues
  >({
    resolver: zodResolver(locationPourClientSchema),
  });
  const bienChoisi = Number(creationForm.watch("idBienService")) || 0;

  const confirmerForm = useForm<
    ConfirmerLocationFormInput,
    unknown,
    ConfirmerLocationFormValues
  >({
    resolver: zodResolver(confirmerLocationSchema),
  });

  const dureeForm = useForm<
    ModifierDureeLocationFormInput,
    unknown,
    ModifierDureeLocationFormValues
  >({
    resolver: zodResolver(modifierDureeLocationSchema),
  });
  const nouvelleFinSaisie = dureeForm.watch("nouvelleDateFin");
  const estProlongation =
    !!modifiant &&
    !!nouvelleFinSaisie &&
    nouvelleFinSaisie > versChampDate(modifiant.dateFin);

  // Complément à encaisser pour une prolongation : nouveau total - (déjà versé - déjà remboursé).
  // Un éventuel trop-perçu est ainsi réutilisé avant de demander un nouveau paiement.
  const complementDu = (() => {
    if (!modifiant || !estProlongation || !modifiant.prixJournalier) return 0;
    const jours = Math.round(
      (new Date(nouvelleFinSaisie).getTime() -
        new Date(versChampDate(modifiant.dateDebut)).getTime()) /
        86400000,
    );
    const nouveauTotal = modifiant.prixJournalier * jours;
    const dejaVerse = modifiant.totalEncaisse - modifiant.totalRembourse;
    return Math.max(0, Math.round((nouveauTotal - dejaVerse) * 100) / 100);
  })();
  const { setValue: setDureeValue } = dureeForm;
  useEffect(() => {
    if (estProlongation) {
      setDureeValue("montantComplement", complementDu > 0 ? complementDu : "");
    }
  }, [estProlongation, complementDu, setDureeValue]);

  const rembourserForm = useForm<
    RembourserLocationFormInput,
    unknown,
    RembourserLocationFormValues
  >({
    resolver: zodResolver(rembourserLocationSchema),
  });

  async function onCreer(values: LocationPourClientFormValues) {
    try {
      await createMutation.mutateAsync({
        idBienService: values.idBienService,
        idClient: values.idClient,
        destination: values.destination,
        dateDebut: `${values.dateDebut}T00:00:00`,
        dateFin: `${values.dateFin}T00:00:00`,
      });
      toast.success("Location enregistrée pour le client.");
      creationForm.reset();
      setCreationOuverte(false);
      setPage(0);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Location impossible.",
      );
    }
  }

  function openConfirmer(location: LocationBienServiceResponse) {
    setConfirmant(location);
    confirmerForm.reset({
      montantPaiement: location.montantTotal,
      modePaiement: "",
      referencePaiement: "",
      dateDebut: versChampDate(location.dateDebut),
      dateFin: versChampDate(location.dateFin),
    });
  }

  async function onConfirmer(values: ConfirmerLocationFormValues) {
    if (!confirmant) return;
    try {
      await confirmerMutation.mutateAsync({
        id: confirmant.idLocationBienService,
        body: {
          montantPaiement: values.montantPaiement,
          modePaiement: values.modePaiement,
          referencePaiement: values.referencePaiement,
          dateDebut: `${values.dateDebut}T00:00:00`,
          dateFin: `${values.dateFin}T00:00:00`,
        },
      });
      toast.success("Paiement enregistré, location confirmée.");
      setConfirmant(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Confirmation impossible.",
      );
    }
  }

  async function handleAnnuler() {
    if (!annulant) return;
    try {
      await annulerMutation.mutateAsync(annulant.idLocationBienService);
      toast.success("Location annulée.");
      setAnnulant(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Annulation impossible.",
      );
    }
  }

  function openModifierDuree(location: LocationBienServiceResponse) {
    setModifiant(location);
    dureeForm.reset({
      nouvelleDateFin: versChampDate(location.dateFin),
      modePaiementComplement: "",
      referencePaiementComplement: "",
    });
  }

  async function onModifierDuree(values: ModifierDureeLocationFormValues) {
    if (!modifiant) return;
    const prolongation = values.nouvelleDateFin > versChampDate(modifiant.dateFin);
    try {
      const reponse = await modifierDureeMutation.mutateAsync({
        id: modifiant.idLocationBienService,
        body: {
          nouvelleDateFin: `${values.nouvelleDateFin}T00:00:00`,
          // Le complément n'a de sens qu'en cas de prolongation
          ...(prolongation && values.montantComplement
            ? {
                montantComplement: values.montantComplement,
                modePaiementComplement: values.modePaiementComplement,
                referencePaiementComplement:
                  values.referencePaiementComplement || undefined,
              }
            : {}),
        },
      });
      toast.success(
        prolongation
          ? `Location prolongée. ${libelleSolde(reponse.solde)} : ${formatMontant(Math.abs(reponse.solde))}.`
          : `Durée raccourcie. ${libelleSolde(reponse.solde)} : ${formatMontant(Math.abs(reponse.solde))}.`,
      );
      setModifiant(null);
      setDetail((d) => (d ? reponse.location : d));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Modification impossible.",
      );
    }
  }

  function openRembourser(location: LocationBienServiceResponse) {
    setRemboursant(location);
    rembourserForm.reset({
      montant: Math.abs(location.solde),
      modeRemboursement: "",
      reference: "",
      motif: "",
    });
  }

  async function onRembourser(values: RembourserLocationFormValues) {
    if (!remboursant) return;
    try {
      await rembourserMutation.mutateAsync({
        id: remboursant.idLocationBienService,
        body: {
          montant: values.montant,
          modeRemboursement: values.modeRemboursement,
          reference: values.reference || undefined,
          motif: values.motif || undefined,
        },
      });
      toast.success("Remboursement enregistré.");
      setRemboursant(null);
      setDetail(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Remboursement impossible.",
      );
    }
  }

  // Jours restants avant la fin prévue (0 si la date de fin est atteinte ou dépassée)
  const joursRestants = cloturant
    ? Math.max(
        0,
        Math.round(
          (new Date(versChampDate(cloturant.dateFin)).getTime() -
            new Date(new Date().toISOString().slice(0, 10)).getTime()) /
            86400000,
        ),
      )
    : 0;
  const estimationRemboursement =
    cloturant && cloturant.duree > 0
      ? (cloturant.montantTotal / cloturant.duree) * joursRestants
      : 0;

  async function handleCloturer(raccourcir: boolean) {
    if (!cloturant) return;
    try {
      const reponse = await statutMutation.mutateAsync({
        id: cloturant.idLocationBienService,
        statut: "TERMINE",
        raccourcir,
      });
      setCloturant(null);
      if (reponse.statut === "TERMINE") {
        toast.success("Location clôturée.");
        setDetail(null);
      } else {
        // Clôture anticipée : durée ramenée à aujourd'hui, trop-perçu à rembourser avant de terminer
        toast.info(
          `Durée ramenée à aujourd'hui. Remboursez le trop-perçu de ${formatMontant(Math.abs(reponse.solde))} puis terminez la location.`,
        );
        setDetail((d) => (d ? reponse : d));
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Clôture impossible.",
      );
    }
  }

  const columns: DataTableColumn<LocationBienServiceResponse>[] = [
    {
      key: "bien",
      header: "Bien / service",
      render: (l) => (
        <span className="flex items-center gap-2">
          <Package
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {l.libelleBienService}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (l) => (
        <span className="flex items-center gap-2">
          <User
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {l.nomClient}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (l) => {
        if (!l.emailClient && !l.telephoneClient) return "-";
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-600">
            {l.emailClient && (
              <span className="flex items-center gap-1.5">
                <Mail
                  size={13}
                  className="shrink-0 text-primary-600"
                  aria-hidden="true"
                />
                {l.emailClient}
              </span>
            )}
            {l.telephoneClient && (
              <span className="flex items-center gap-1.5">
                <Phone
                  size={13}
                  className="shrink-0 text-primary-600"
                  aria-hidden="true"
                />
                {l.telephoneClient}
              </span>
            )}
          </div>
        );
      },
    },
    { key: "dateDebut", header: "Du", render: (l) => formatDate(l.dateDebut) },
    {
      key: "dateFin",
      header: "Au",
      render: (l) => (
        <span className="flex items-center gap-1.5">
          {formatDate(l.dateFin)}
          <EcheanceBadge location={l} />
        </span>
      ),
    },
    {
      key: "montant",
      header: "Montant",
      align: "right",
      render: (l) => formatMontant(l.montantTotal),
    },
    {
      key: "statut",
      header: "Statut",
      render: (l) => <StatutBadge statut={l.statut} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (l) => {
        const items: ActionGroupItem[] = [];
        if (l.statut === "EN_ATTENTE") {
          items.push({
            label: "Encaisser et confirmer",
            text: "Confirmer",
            icon: <CheckCircle2 size={15} aria-hidden="true" />,
            onClick: () => openConfirmer(l),
          });
          items.push({
            label: "Annuler",
            icon: <XCircle size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => setAnnulant(l),
          });
        }
        if (l.statut === "ACTIF") {
          items.push({
            label: "Prolonger ou raccourcir",
            text: "Durée",
            icon: <CalendarClock size={15} aria-hidden="true" />,
            onClick: () => openModifierDuree(l),
          });
          if (l.solde < 0) {
            items.push({
              label: "Rembourser le trop-perçu",
              text: "Rembourser",
              icon: <Banknote size={15} aria-hidden="true" />,
              onClick: () => openRembourser(l),
            });
          }
          items.push({
            label: "Clôturer la location",
            text: "Clôturer",
            icon: <Flag size={15} aria-hidden="true" />,
            onClick: () => setCloturant(l),
          });
        }
        return (
          <ActionGroup
            items={[
              {
                label: "Voir le détail de la location",
                text: "Détails",
                icon: <Eye size={15} aria-hidden="true" />,
                onClick: () => setDetail(l),
              },
              ...items,
            ]}
          />
        );
      },
    },
  ];

  return (
    <div>
      <BienServiceDetailModal
        idBienService={detailBien}
        onClose={() => setDetailBien(null)}
      />
      <PageHeader
        tone="indigo"
        title="Locations de biens et services"
        description="Les locations courte durée déposées par les clients ou saisies par l'agence."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => setCreationOuverte(true)}
          >
            Nouvelle location
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} />

      {locationsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les locations"
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
                  setStatutFilter(
                    e.target.value as StatutLocationBienService | "",
                  );
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({
                  value: s,
                  label: statutLabel(s),
                }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={aEcheance}
                onChange={(e) => {
                  setAEcheance(e.target.checked);
                  setPage(0);
                }}
                className="h-4 w-4 rounded border-slate-300"
              />
              À échéance
            </label>
            <div className="sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher un bien ou un client…"
                ariaLabel="Rechercher parmi les locations"
              />
            </div>
          </div>
          <DataTable
            data={lignes}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(l) => l.idLocationBienService}
            loading={locationsQuery.isLoading}
            emptyMessage={
              search || statutFilter || aEcheance
                ? "Aucune location ne correspond à votre recherche"
                : "Aucune location pour le moment"
            }
          />
          {locationsQuery.data && (
            <Pagination
              currentPage={locationsQuery.data.page.number}
              totalPages={locationsQuery.data.page.totalPages}
              totalElements={locationsQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={creationOuverte}
        onClose={() => setCreationOuverte(false)}
        title="Louer pour un client"
        titleTone="indigo"
        size="xl"
      >
        <form
          className={`grid gap-4 ${bienChoisi ? "md:grid-cols-2" : ""}`}
          onSubmit={creationForm.handleSubmit(onCreer)}
          noValidate
        >
          <div className="space-y-4 md:order-2">
            <RemoteCombobox
              label="Client"
              required
              placeholder="Rechercher un client (nom, email, téléphone)"
              useOptions={useClientsOptions}
              value={creationForm.watch("idClient")}
              error={creationForm.formState.errors.idClient?.message}
              {...creationForm.register("idClient")}
            />
            <RemoteCombobox
              label="Bien ou service"
              required
              placeholder="Rechercher un bien ou un service"
              useOptions={useBiensServicesDisponiblesOptions}
              value={creationForm.watch("idBienService")}
              error={creationForm.formState.errors.idBienService?.message}
              {...creationForm.register("idBienService")}
            />
            <Input
              label="Destination / usage"
              {...creationForm.register("destination")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Date de début"
                type="date"
                required
                error={creationForm.formState.errors.dateDebut?.message}
                {...creationForm.register("dateDebut")}
              />
              <Input
                label="Date de fin"
                type="date"
                required
                error={creationForm.formState.errors.dateFin?.message}
                {...creationForm.register("dateFin")}
              />
            </div>
            <Button type="submit" fullWidth loading={createMutation.isPending}>
              Créer la location
            </Button>
          </div>
          {bienChoisi > 0 && (
            <div className="md:order-1">
              <EntityPhotoPreview
                entiteType="BIEN_SERVICE"
                entiteId={bienChoisi}
                alt="Photos du bien ou service choisi"
              />
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        title="Détail de la location"
        titleTone="indigo"
        size="lg"
      >
        {detail && (
          <div className="space-y-5 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {detail.libelleBienService}
                </p>
                <p>{detail.nomClient}</p>
                {detail.emailClient && (
                  <p className="text-slate-500">{detail.emailClient}</p>
                )}
                {detail.telephoneClient && (
                  <p className="text-slate-500">{detail.telephoneClient}</p>
                )}
                {detail.destination && (
                  <p className="text-slate-500">
                    Destination : {detail.destination}
                  </p>
                )}
              </div>
              <StatutBadge statut={detail.statut} />
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Du</dt>
                <dd>{formatDate(detail.dateDebut)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Au</dt>
                <dd>{formatDate(detail.dateFin)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Durée</dt>
                <dd>
                  {detail.duree} jour{detail.duree > 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Montant total</dt>
                <dd>{formatMontant(detail.montantTotal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Encaissé</dt>
                <dd>{formatMontant(detail.totalEncaisse)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Remboursé</dt>
                <dd>{formatMontant(detail.totalRembourse)}</dd>
              </div>
            </dl>

            {detail.statut !== "EN_ATTENTE" && detail.statut !== "ANNULE" && (
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">
                  {libelleSolde(detail.solde)} :{" "}
                </span>
                <strong>{formatMontant(Math.abs(detail.solde))}</strong>
              </p>
            )}

            <section>
              <h3 className="mb-2 font-semibold text-slate-900">Paiements</h3>
              {detail.historiquePaiements.length === 0 ? (
                <p className="text-slate-500">Aucun paiement enregistré.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {detail.historiquePaiements.map((p) => (
                    <li
                      key={p.idPaiement}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span>
                        {formatDateTime(p.datePaiement)} - {p.modePaiement}
                        {p.typePaiement === "PROLONGATION" &&
                          " (prolongation)"}
                      </span>
                      <strong>{formatMontant(p.montant)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold text-slate-900">
                Remboursements
              </h3>
              {(remboursementsQuery.data ?? []).length === 0 ? (
                <p className="text-slate-500">Aucun remboursement.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {(remboursementsQuery.data ?? []).map((r) => (
                    <li
                      key={r.idRemboursement}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span>
                        {formatDateTime(r.dateRemboursement)} -{" "}
                        {r.modeRemboursement}
                        {r.motif ? ` (${r.motif})` : ""}
                      </span>
                      <strong>{formatMontant(r.montant)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDetailBien(detail.idBienService)}
            >
              Voir le bien ou service
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={confirmant !== null}
        onClose={() => setConfirmant(null)}
        title="Encaisser et confirmer la location"
        titleTone="indigo"
      >
        {confirmant && (
          <form
            className="space-y-4"
            onSubmit={confirmerForm.handleSubmit(onConfirmer)}
            noValidate
          >
            <p className="text-sm text-slate-600">
              Location de <strong>{confirmant.libelleBienService}</strong> pour{" "}
              <strong>{confirmant.nomClient}</strong>, montant estimé{" "}
              {formatMontant(confirmant.montantTotal)}.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Date de début"
                type="date"
                required
                error={confirmerForm.formState.errors.dateDebut?.message}
                {...confirmerForm.register("dateDebut")}
              />
              <Input
                label="Date de fin"
                type="date"
                required
                helperText="Modifiable si les dates ont été négociées au comptoir."
                error={confirmerForm.formState.errors.dateFin?.message}
                {...confirmerForm.register("dateFin")}
              />
            </div>
            <Input
              label="Montant encaissé"
              type="number"
              min={0}
              step="any"
              required
              error={confirmerForm.formState.errors.montantPaiement?.message}
              {...confirmerForm.register("montantPaiement")}
            />
            <Input
              label="Mode de paiement"
              placeholder="ESPECES, VIREMENT_BANCAIRE, MOBILE_MONEY…"
              required
              error={confirmerForm.formState.errors.modePaiement?.message}
              {...confirmerForm.register("modePaiement")}
            />
            <Input
              label="Référence"
              {...confirmerForm.register("referencePaiement")}
            />
            <Button
              type="submit"
              fullWidth
              loading={confirmerMutation.isPending}
            >
              Encaisser et confirmer
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={modifiant !== null}
        onClose={() => setModifiant(null)}
        title="Prolonger ou raccourcir la location"
        titleTone="indigo"
      >
        {modifiant && (
          <form
            className="space-y-4"
            onSubmit={dureeForm.handleSubmit(onModifierDuree)}
            noValidate
          >
            <p className="text-sm text-slate-600">
              Location de <strong>{modifiant.libelleBienService}</strong> pour{" "}
              <strong>{modifiant.nomClient}</strong>, du{" "}
              {formatDate(modifiant.dateDebut)} au{" "}
              {formatDate(modifiant.dateFin)}.
            </p>
            <Input
              label="Nouvelle date de fin"
              type="date"
              required
              helperText="Après la date actuelle : prolongation. Avant : raccourcissement, un trop-perçu pourra être remboursé."
              error={dureeForm.formState.errors.nouvelleDateFin?.message}
              {...dureeForm.register("nouvelleDateFin")}
            />
            {estProlongation && (
              <>
                <Input
                  label="Complément encaissé (optionnel)"
                  type="number"
                  min={0}
                  step="any"
                  helperText={
                    complementDu > 0
                      ? `Reste dû calculé automatiquement : ${formatMontant(complementDu)}.`
                      : "Rien à encaisser : les sommes déjà versées couvrent la prolongation."
                  }
                  error={dureeForm.formState.errors.montantComplement?.message}
                  {...dureeForm.register("montantComplement")}
                />
                <Input
                  label="Mode de paiement du complément"
                  placeholder="ESPECES, VIREMENT_BANCAIRE, MOBILE_MONEY…"
                  error={
                    dureeForm.formState.errors.modePaiementComplement?.message
                  }
                  {...dureeForm.register("modePaiementComplement")}
                />
                <Input
                  label="Référence"
                  {...dureeForm.register("referencePaiementComplement")}
                />
              </>
            )}
            <Button
              type="submit"
              fullWidth
              loading={modifierDureeMutation.isPending}
            >
              Enregistrer la nouvelle durée
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={remboursant !== null}
        onClose={() => setRemboursant(null)}
        title="Rembourser le trop-perçu"
        titleTone="indigo"
      >
        {remboursant && (
          <form
            className="space-y-4"
            onSubmit={rembourserForm.handleSubmit(onRembourser)}
            noValidate
          >
            <p className="text-sm text-slate-600">
              Location de <strong>{remboursant.libelleBienService}</strong> pour{" "}
              <strong>{remboursant.nomClient}</strong>. Trop-perçu disponible :{" "}
              <strong>{formatMontant(Math.abs(remboursant.solde))}</strong>.
            </p>
            <Input
              label="Montant remboursé"
              type="number"
              min={0}
              step="any"
              required
              error={rembourserForm.formState.errors.montant?.message}
              {...rembourserForm.register("montant")}
            />
            <Input
              label="Mode de remboursement"
              placeholder="ESPECES, VIREMENT_BANCAIRE, MOBILE_MONEY…"
              required
              error={rembourserForm.formState.errors.modeRemboursement?.message}
              {...rembourserForm.register("modeRemboursement")}
            />
            <Input
              label="Référence"
              {...rembourserForm.register("reference")}
            />
            <Input label="Motif" {...rembourserForm.register("motif")} />
            <Button
              type="submit"
              fullWidth
              loading={rembourserMutation.isPending}
            >
              Enregistrer le remboursement
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={cloturant !== null}
        onClose={() => setCloturant(null)}
        title="Clôturer cette location ?"
        titleTone="indigo"
      >
        {cloturant && (
          <>
            <p className="text-sm text-slate-600">
              La location de <strong>{cloturant.libelleBienService}</strong>{" "}
              pour <strong>{cloturant.nomClient}</strong> passera au statut
              terminé.
            </p>
            {joursRestants > 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                La date de fin prévue ({formatDate(cloturant.dateFin)}) n&apos;est
                pas atteinte : il reste {joursRestants} jour(s). Voulez-vous
                ramener la fin de la location à aujourd&apos;hui ? Un
                remboursement d&apos;environ{" "}
                {formatMontant(estimationRemboursement)} sera alors à effectuer
                avant la clôture. Sinon, la location reste active et vous
                pouvez ajuster la durée avec le bouton Durée.
              </p>
            )}
            {cloturant.solde > 0 && (
              <p className="mt-2 text-sm text-amber-700">
                Attention : il reste {formatMontant(cloturant.solde)} à payer
                sur cette location.
              </p>
            )}
            {cloturant.solde < 0 && (
              <p className="mt-2 text-sm text-amber-700">
                Un trop-perçu de {formatMontant(Math.abs(cloturant.solde))} est
                à rembourser avant de pouvoir terminer la location.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {joursRestants > 0 ? (
                <>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setCloturant(null);
                      toast.info(
                        "La location reste active. Utilisez le bouton Durée pour ajuster la fin, puis remboursez avant de clôturer.",
                      );
                    }}
                  >
                    Non, je gère la durée moi-même
                  </Button>
                  <Button
                    className="flex-1"
                    loading={statutMutation.isPending}
                    onClick={() => handleCloturer(true)}
                  >
                    Oui, ramener à aujourd&apos;hui
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setCloturant(null)}
                  >
                    Retour
                  </Button>
                  <Button
                    className="flex-1"
                    loading={statutMutation.isPending}
                    onClick={() => handleCloturer(false)}
                  >
                    Clôturer
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={annulant !== null}
        onClose={() => setAnnulant(null)}
        title="Annuler cette location ?"
        titleTone="indigo"
      >
        {annulant && (
          <>
            <p className="text-sm text-slate-600">
              Vous êtes sur le point d&apos;annuler la location de{" "}
              <strong>{annulant.libelleBienService}</strong> pour{" "}
              <strong>{annulant.nomClient}</strong>.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setAnnulant(null)}
              >
                Retour
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={annulerMutation.isPending}
                onClick={handleAnnuler}
              >
                Annuler la location
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
