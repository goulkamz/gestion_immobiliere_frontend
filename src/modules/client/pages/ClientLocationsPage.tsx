import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import { useBiensServicesDisponiblesOptions } from "@/hooks/useOptionsSelection";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { statutLabel } from "@/utils/statut";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Eye, Package, Plus, XCircle } from "lucide-react";
import {
  ActionGroup,
  BienServiceDetailModal,
  Button,
  CompteursStatut,
  DataTable,
  EmptyState,
  EntityPhotoPreview,
  Input,
  Modal,
  PageHeader,
  Pagination,
  RemoteCombobox,
  SearchInput,
  Select,
  StatutBadge,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import {
  useAnnulerLocationMutation,
  useCreateLocationMutation,
  useLocationsQuery,
} from "@/hooks/queries/useLocations";
import {
  locationBienServiceSchema,
  type LocationBienServiceFormInput,
  type LocationBienServiceFormValues,
} from "../schemas";
import { formatDate, formatMontant } from "@/utils/format";
import { locationsApi } from "@/api/locations";
import { ApiError } from "@/api/http";
import type {
  LocationBienServiceResponse,
  StatutLocationBienService,
} from "@/api/types";

const STATUTS = ["EN_ATTENTE", "ACTIF", "TERMINE", "ANNULE"] as const;
const ANNULABLE: LocationBienServiceResponse["statut"][] = ["EN_ATTENTE"];

export function ClientLocationsPage() {
  const [detailBien, setDetailBien] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<
    StatutLocationBienService | ""
  >("");
  // Périmètre (mes données), recherche, statut et pagination sont appliqués côté serveur
  const locationsQuery = useLocationsQuery({
    page,
    size: 20,
    sort: "dateDebut,desc",
    statut: statutFilter || undefined,
    recherche: recherche || undefined,
  });
  const compteurs = useCompteursStatut(
    useLocationsQuery,
    { recherche: recherche || undefined },
    STATUTS,
  );
  const locations = locationsQuery.data?.content ?? [];
  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: locations,
    getId: (l) => l.idLocationBienService,
    fetchOne: locationsApi.getLocation,
    queryKey: ["locations"],
  });
  const createMutation = useCreateLocationMutation();
  const annulerMutation = useAnnulerLocationMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<
    LocationBienServiceFormInput,
    unknown,
    LocationBienServiceFormValues
  >({
    resolver: zodResolver(locationBienServiceSchema),
  });

  const bienChoisi = Number(watch("idBienService")) || 0;

  async function onSubmit(values: LocationBienServiceFormValues) {
    try {
      await createMutation.mutateAsync({
        idBienService: values.idBienService,
        destination: values.destination,
        dateDebut: `${values.dateDebut}T00:00:00`,
        dateFin: `${values.dateFin}T00:00:00`,
      });
      toast.success("Demande de location envoyée à l'agence.");
      reset();
      setModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Demande impossible.",
      );
    }
  }

  async function handleAnnuler(id: number) {
    try {
      await annulerMutation.mutateAsync(id);
      toast.success("Location annulée.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Annulation impossible.",
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
    { key: "dateDebut", header: "Du", render: (l) => formatDate(l.dateDebut) },
    { key: "dateFin", header: "Au", render: (l) => formatDate(l.dateFin) },
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
        const items: ActionGroupItem[] = ANNULABLE.includes(l.statut)
          ? [
              {
                label: "Annuler la location",
                text: "Annuler",
                icon: <XCircle size={15} aria-hidden="true" />,
                tone: "danger",
                onClick: () => handleAnnuler(l.idLocationBienService),
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
                onClick: () => setDetailBien(l.idBienService),
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
        title="Mes locations"
        description="Location courte durée de biens et services - véhicules, équipements, sans contrat de bail."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => setModalOpen(true)}
          >
            Nouvelle location
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} />

      {locationsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos locations"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-44">
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
                options={STATUTS.map((st) => ({
                  value: st,
                  label: statutLabel(st),
                }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher un bien ou service…"
                ariaLabel="Rechercher parmi mes locations"
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
              search || statutFilter
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
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle location"
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <RemoteCombobox
            label="Bien ou service"
            required
            placeholder="Rechercher un bien ou un service"
            useOptions={useBiensServicesDisponiblesOptions}
            value={bienChoisi}
            error={errors.idBienService?.message}
            {...register("idBienService")}
          />
          <EntityPhotoPreview
            entiteType="BIEN_SERVICE"
            entiteId={bienChoisi}
            alt="Photos du bien ou service choisi"
          />
          <Input label="Destination / usage" {...register("destination")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date de début"
              type="date"
              required
              error={errors.dateDebut?.message}
              {...register("dateDebut")}
            />
            <Input
              label="Date de fin"
              type="date"
              required
              error={errors.dateFin?.message}
              {...register("dateFin")}
            />
          </div>
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Envoyer la demande
          </Button>
        </form>
      </Modal>
    </div>
  );
}
