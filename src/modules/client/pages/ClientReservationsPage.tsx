import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Eye, Home, Info, Plus, XCircle } from "lucide-react";
import {
  ActionGroup,
  Button,
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  StatutBadge,
  MaisonDetailModal,
  EntityPhotoPreview,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import {
  useAnnulerReservationMutation,
  useCreateReservationMutation,
  useReservationsQuery,
} from "@/hooks/queries/useReservations";
import {
  useMaisonsQuery,
  useParametresPubliquesQuery,
} from "@/hooks/queries/usePublicCatalog";
import {
  reservationSchema,
  type ReservationFormInput,
  type ReservationFormValues,
} from "../schemas";
import { formatDateTime } from "@/utils/format";
import { getParametreEntier } from "@/utils/parametres";
import { dateDebutMaintenant } from "@/utils/dateDebut";
import { ApiError } from "@/api/http";
import type { ReservationResponse } from "@/api/types";

const ANNULABLE: ReservationResponse["statut"][] = ["EN_ATTENTE", "CONFIRMEE"];

export function ClientReservationsPage() {
  const [detailMaison, setDetailMaison] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const reservationsQuery = useReservationsQuery({ size: 50 });
  const maisonsQuery = useMaisonsQuery({ statut: "DISPONIBLE", size: 100 });
  const parametresQuery = useParametresPubliquesQuery();
  const delaiExpirationHeures = getParametreEntier(
    parametresQuery.data,
    "DELAI_EXPIRATION_RESERVATION_HEURES",
    6,
  );
  const createMutation = useCreateReservationMutation();
  const annulerMutation = useAnnulerReservationMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReservationFormInput, unknown, ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
  });

  const maisonChoisie = Number(watch("idMaison")) || 0;

  async function onSubmit(values: ReservationFormValues) {
    try {
      const response = await createMutation.mutateAsync({
        idMaison: values.idMaison,
        dateDebut: dateDebutMaintenant(),
      });
      const delaiHeures = Math.round(
        (new Date(response.dateFin).getTime() -
          new Date(response.dateDebut).getTime()) /
          3_600_000,
      );
      toast.success(
        `Réservation envoyée à l'agence. Sans confirmation avant ${formatDateTime(response.dateFin)} (${delaiHeures}h), elle expirera automatiquement.`,
      );
      reset();
      setModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Réservation impossible.",
      );
    }
  }

  async function handleAnnuler(id: number) {
    try {
      await annulerMutation.mutateAsync(id);
      toast.success("Réservation annulée.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Annulation impossible.",
      );
    }
  }

  const filtered = useMemo(() => {
    const list = reservationsQuery.data?.content ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      (r.nomCommunMaison ?? "").toLowerCase().includes(term),
    );
  }, [reservationsQuery.data, search]);

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
          {r.nomCommunMaison ?? `Maison #${r.idMaison}`}
        </span>
      ),
    },
    {
      key: "dateDebut",
      header: "Demandée le",
      render: (r) => formatDateTime(r.dateDebut),
    },
    {
      key: "expiration",
      header: "Expire le",
      render: (r) =>
        r.statut === "EN_ATTENTE" ? formatDateTime(r.dateFin) : "-",
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
        const items: ActionGroupItem[] = ANNULABLE.includes(r.statut)
          ? [
              {
                label: "Annuler la réservation",
                text: "Annuler",
                icon: <XCircle size={15} aria-hidden="true" />,
                tone: "danger",
                onClick: () => handleAnnuler(r.idReservation),
              },
            ]
          : [];
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
        title="Mes réservations"
        description="Réservation d'une maison en location longue durée, avec contrat à la clé."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => setModalOpen(true)}
          >
            Nouvelle réservation
          </Button>
        }
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-700">
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p>
          <span className="font-semibold">
            Confirmation sous {delaiExpirationHeures} heures :
          </span>{" "}
          une réservation bloque la maison dès son envoi. Si l&apos;agence ne la
          confirme pas dans les {delaiExpirationHeures} heures qui suivent, elle
          est automatiquement annulée et la maison redevient disponible.
        </p>
      </div>

      {reservationsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos réservations"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une maison…"
              ariaLabel="Rechercher parmi mes réservations"
            />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(r) => r.idReservation}
            loading={reservationsQuery.isLoading}
            emptyMessage={
              search
                ? "Aucune réservation ne correspond à votre recherche"
                : "Aucune réservation pour le moment"
            }
          />
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle réservation"
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Select
            label="Maison"
            required
            placeholder="Sélectionner une maison"
            defaultValue=""
            options={(maisonsQuery.data?.content ?? []).map((m) => ({
              value: m.idMaison,
              label: m.nomCommunMaison ?? `Maison #${m.idMaison}`,
            }))}
            error={errors.idMaison?.message}
            {...register("idMaison")}
          />
          <EntityPhotoPreview
            entiteType="MAISON"
            entiteId={maisonChoisie}
            alt="Photos de la maison choisie"
          />
          <p className="flex items-start gap-2 rounded-lg bg-primary-50 px-3 py-2.5 text-xs text-primary-700">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Dès l&apos;envoi, cette réservation bloque la maison pendant{" "}
              {delaiExpirationHeures} heures, le temps que l&apos;agence vous
              contacte pour finaliser le dossier. Si vous savez que vous ne
              serez pas joignable dans les {delaiExpirationHeures} prochaines
              heures, mieux vaut attendre avant de réserver.
            </span>
          </p>
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Envoyer la réservation
          </Button>
        </form>
      </Modal>
    </div>
  );
}
