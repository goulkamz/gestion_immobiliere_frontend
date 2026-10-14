import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileCheck2,
  Home,
  Mail,
  Phone,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import {
  ActionGroup,
  Button,
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
  MaisonDetailModal,
  EntityPhotoPreview,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import {
  useAnnulerReservationMutation,
  useConfirmerReservationMutation,
  useConvertirReservationMutation,
  useCreateReservationMutation,
  useReservationsQuery,
} from "@/hooks/queries/useReservations";
import {
  useClientsOptions,
  useMaisonsDisponiblesOptions,
} from "@/hooks/useOptionsSelection";
import { dateDebutInputDefaut } from "@/utils/dateDebut";
import {
  convertirReservationSchema,
  type ConvertirReservationFormInput,
  type ConvertirReservationFormValues,
  reservationPourClientSchema,
  type ReservationPourClientFormInput,
  type ReservationPourClientFormValues,
} from "../schemas";
import { formatDateTime } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import { ApiError } from "@/api/http";
import type { ReservationResponse, StatutReservation } from "@/api/types";

const STATUTS: StatutReservation[] = [
  "EN_ATTENTE",
  "CONFIRMEE",
  "CONVERTIE",
  "ANNULEE",
];

export function AgentReservationsPage() {
  const [detailMaison, setDetailMaison] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutReservation | "">("");
  const [annulant, setAnnulant] = useState<ReservationResponse | null>(null);
  const [creationOuverte, setCreationOuverte] = useState(false);
  const [convertissant, setConvertissant] =
    useState<ReservationResponse | null>(null);
  const [page, setPage] = useState(0);
  const [rechercheDebounced, setRechercheDebounced] = useState("");

  // Recherche envoyée au serveur après une courte pause de saisie
  useEffect(() => {
    const timer = setTimeout(() => {
      setRechercheDebounced(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const reservationsQuery = useReservationsQuery({
    page,
    size: 20,
    sort: "dateDebut,desc",
    statut: statutFilter || undefined,
    recherche: rechercheDebounced || undefined,
  });
  const compteurs = useCompteursStatut(useReservationsQuery, { recherche: rechercheDebounced || undefined }, STATUTS);
  const confirmerMutation = useConfirmerReservationMutation();
  const annulerMutation = useAnnulerReservationMutation();
  const convertirMutation = useConvertirReservationMutation();
  const createMutation = useCreateReservationMutation();

  const creationForm = useForm<
    ReservationPourClientFormInput,
    unknown,
    ReservationPourClientFormValues
  >({
    resolver: zodResolver(reservationPourClientSchema),
  });
  // Client et maison sont choisis via une recherche côté serveur (RemoteCombobox) : aucune liste plafonnée
  const clientChoisi = creationForm.watch("idClient");
  const maisonChoisie = creationForm.watch("idMaison");

  const convertirForm = useForm<
    ConvertirReservationFormInput,
    unknown,
    ConvertirReservationFormValues
  >({
    resolver: zodResolver(convertirReservationSchema),
  });

  // Filtre statut, recherche et pagination sont appliqués côté serveur
  const reservations = reservationsQuery.data?.content ?? [];

  async function handleConfirmer(reservation: ReservationResponse) {
    try {
      await confirmerMutation.mutateAsync(reservation.idReservation);
      toast.success("Réservation confirmée.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Confirmation impossible.",
      );
    }
  }

  function ouvrirCreation() {
    creationForm.reset({ dateDebut: dateDebutInputDefaut() });
    setCreationOuverte(true);
  }

  function fermerCreation() {
    creationForm.reset({ dateDebut: dateDebutInputDefaut() });
    setCreationOuverte(false);
  }

  async function onCreer(values: ReservationPourClientFormValues) {
    try {
      await createMutation.mutateAsync({
        idMaison: values.idMaison,
        idClient: values.idClient,
        dateDebut: `${values.dateDebut}:00`,
      });
      toast.success("Réservation créée pour le client.");
      fermerCreation();
      setPage(0);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Réservation impossible.",
      );
    }
  }

  async function handleAnnuler() {
    if (!annulant) return;
    try {
      await annulerMutation.mutateAsync(annulant.idReservation);
      toast.success("Réservation annulée.");
      setAnnulant(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Annulation impossible.",
      );
    }
  }

  function openConvertir(reservation: ReservationResponse) {
    setConvertissant(reservation);
    convertirForm.reset({
      typeContrat: "HABITATION",
      montantLoyer: reservation.loyerMaison ?? undefined,
    });
  }

  async function onConvertir(values: ConvertirReservationFormValues) {
    if (!convertissant) return;
    try {
      await convertirMutation.mutateAsync({
        id: convertissant.idReservation,
        params: {
          montantLoyer: values.montantLoyer,
          typeContrat: values.typeContrat,
          dateSortie: values.dateSortie
            ? `${values.dateSortie}T00:00:00`
            : undefined,
        },
      });
      toast.success(
        <span>
          Contrat de location créé.{" "}
          <Link
            to={`/espace-agent/contrats-location?recherche=${encodeURIComponent(convertissant.nomCommunMaison)}`}
            className="font-semibold underline"
          >
            Voir le contrat
          </Link>
        </span>,
        { autoClose: 10000 },
      );
      setConvertissant(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Conversion impossible.",
      );
    }
  }

  const columns: DataTableColumn<ReservationResponse>[] = [
    {
      key: "maison",
      header: "Maison",
      render: (r) => (
        <span className="flex items-center gap-2">
          <Home
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {r.nomCommunMaison}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (r) => (
        <span className="flex items-center gap-2">
          <User
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {r.nomUser}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (r) => {
        if (!r.emailUser && !r.telephoneUser) return "-";
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Mail
                size={13}
                className="shrink-0 text-primary-600"
                aria-hidden="true"
              />
              {r.emailUser}
            </span>
            {r.telephoneUser && (
              <span className="flex items-center gap-1.5">
                <Phone
                  size={13}
                  className="shrink-0 text-primary-600"
                  aria-hidden="true"
                />
                {r.telephoneUser}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "dateDebut",
      header: "Date de début",
      render: (r) => formatDateTime(r.dateDebut),
    },
    {
      key: "dateFin",
      header: "Expire le",
      render: (r) => formatDateTime(r.dateFin),
    },
    {
      key: "statut",
      header: "Statut",
      render: (r) => <StatutBadge statut={r.statut} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => {
        const items: ActionGroupItem[] = [];
        if (r.statut === "EN_ATTENTE") {
          items.push({
            label: "Confirmer",
            text: "Confirmer",
            icon: <CheckCircle2 size={15} aria-hidden="true" />,
            disabled: confirmerMutation.isPending,
            onClick: () => handleConfirmer(r),
          });
        }
        if (r.statut === "CONFIRMEE") {
          items.push({
            label: "Convertir en contrat",
            text: "Convertir",
            icon: <FileCheck2 size={15} aria-hidden="true" />,
            onClick: () => openConvertir(r),
          });
        }
        if (r.statut === "EN_ATTENTE" || r.statut === "CONFIRMEE") {
          items.push({
            label: "Annuler",
            icon: <XCircle size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => setAnnulant(r),
          });
        }
        return (
          <ActionGroup
            items={[
              {
                label: "Voir le détail",
                text: "Détails",
                icon: <Eye size={15} aria-hidden="true" />,
                onClick: () => setDetailMaison(r.idMaison),
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
      <MaisonDetailModal
        idMaison={detailMaison}
        onClose={() => setDetailMaison(null)}
      />
      <PageHeader
        tone="indigo"
        title="Réservations"
        description="Les demandes de réservation de maisons déposées par les clients."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={ouvrirCreation}
          >
            Nouvelle réservation
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} />

      {reservationsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les réservations"
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
                  setStatutFilter(e.target.value as StatutReservation | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({
                  value: s,
                  label: statutLabel(s),
                }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une maison ou un client…"
                ariaLabel="Rechercher parmi les réservations"
              />
            </div>
          </div>
          <DataTable
            data={reservations}
            columns={columns}
            keyExtractor={(r) => r.idReservation}
            loading={reservationsQuery.isLoading}
            emptyMessage={
              search || statutFilter
                ? "Aucune réservation ne correspond à votre recherche"
                : "Aucune réservation pour le moment"
            }
          />
          {reservationsQuery.data && (
            <Pagination
              currentPage={reservationsQuery.data.page.number}
              totalPages={reservationsQuery.data.page.totalPages}
              totalElements={reservationsQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={creationOuverte}
        onClose={fermerCreation}
        title="Réserver pour un client"
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={creationForm.handleSubmit(onCreer)}
          noValidate
        >
          <RemoteCombobox
            label="Client"
            required
            placeholder="Rechercher un client (nom, email, téléphone)"
            useOptions={useClientsOptions}
            value={clientChoisi}
            error={creationForm.formState.errors.idClient?.message}
            {...creationForm.register("idClient")}
          />
          <RemoteCombobox
            label="Maison"
            required
            placeholder="Rechercher une maison"
            useOptions={useMaisonsDisponiblesOptions}
            value={maisonChoisie}
            error={creationForm.formState.errors.idMaison?.message}
            {...creationForm.register("idMaison")}
          />
          <Input
            label="Date de début"
            type="datetime-local"
            required
            helperText="La réservation bloque la maison à partir de cette date."
            error={creationForm.formState.errors.dateDebut?.message}
            {...creationForm.register("dateDebut")}
          />
          <EntityPhotoPreview
            entiteType="MAISON"
            entiteId={Number(maisonChoisie) || 0}
            alt="Photos de la maison choisie"
          />
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Créer la réservation
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={annulant !== null}
        onClose={() => setAnnulant(null)}
        title="Annuler cette réservation ?"
        titleTone="indigo"
      >
        {annulant && (
          <>
            <p className="text-sm text-slate-600">
              Vous êtes sur le point d&apos;annuler la réservation de{" "}
              <strong>{annulant.nomUser}</strong> sur{" "}
              <strong>{annulant.nomCommunMaison}</strong>.
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
                Annuler la réservation
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={convertissant !== null}
        onClose={() => setConvertissant(null)}
        title="Convertir en contrat de location"
        titleTone="indigo"
      >
        {convertissant && (
          <form
            className="space-y-4"
            onSubmit={convertirForm.handleSubmit(onConvertir)}
            noValidate
          >
            <p className="text-sm text-slate-600">
              Création du contrat de location pour{" "}
              <strong>{convertissant.nomUser}</strong> sur{" "}
              <strong>{convertissant.nomCommunMaison}</strong>.
            </p>
            <Input
              label="Loyer mensuel (F CFA)"
              type="number"
              min={0}
              required
              error={convertirForm.formState.errors.montantLoyer?.message}
              {...convertirForm.register("montantLoyer")}
            />
            <Select
              label="Type de bail"
              options={[
                { value: "HABITATION", label: "Habitation" },
                { value: "COMMERCIAL", label: "Commercial" },
              ]}
              {...convertirForm.register("typeContrat")}
            />
            <Input
              label="Date de sortie prévue (optionnel)"
              type="date"
              helperText="Laissez vide pour un bail à durée indéterminée."
              {...convertirForm.register("dateSortie")}
            />
            <Button
              type="submit"
              fullWidth
              loading={convertirMutation.isPending}
            >
              Créer le contrat de location
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
