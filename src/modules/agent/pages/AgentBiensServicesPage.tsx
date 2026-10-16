import { useVilleFiltre } from "@/hooks/useVilleFiltre";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Edit2,
  Eye,
  Package,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  ActionGroup,
  Button,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PhotoManager,
  PhotoPicker,
  Pagination,
  RemoteCombobox,
  SearchInput,
  Select,
  StatutBadge,
  Textarea,
  BienServiceDetailModalFromData,
} from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useBiensServicesQuery } from "@/hooks/queries/usePublicCatalog";
import { useCategoriesOptions, useGestionnairesOptions, useSecteursOptions } from "@/hooks/useOptionsSelection";
import {
  useCreateBienServiceMutation,
  useDeleteBienServiceMutation,
  useUpdateBienServiceMutation,
  useUpdateDisponibiliteBienServiceMutation,
} from "@/hooks/queries/useBiensServicesAgent";
import {
  bienServiceCreateSchema,
  bienServiceEditSchema,
  type BienServiceCreateFormInput,
  type BienServiceCreateFormValues,
  type BienServiceEditFormInput,
  type BienServiceEditFormValues,
} from "../schemas";
import { statutLabel } from "@/utils/statut";
import { formatMontant } from "@/utils/format";
import { useAttachPhotos } from "@/hooks/queries/useMedias";
import { ApiError } from "@/api/http";
import type { BienServiceResponse, StatutBienService } from "@/api/types";

// Transitions manuelles autorisées (miroir du backend) : RESERVEE et LOUEE ne se changent pas à la main.
const STATUT_TRANSITIONS: Record<StatutBienService, StatutBienService[]> = {
  DISPONIBLE: ["EN_MAINTENANCE"],
  EN_MAINTENANCE: ["DISPONIBLE"],
  RESERVEE: [],
  LOUEE: [],
};

export function AgentBiensServicesPage() {
  const [detail, setDetail] = useState<BienServiceResponse | null>(null);
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BienServiceResponse | null>(null);
  const [changingStatut, setChangingStatut] =
    useState<BienServiceResponse | null>(null);
  const [nouveauStatut, setNouveauStatut] = useState<StatutBienService | "">(
    "",
  );
  const [deleting, setDeleting] = useState<BienServiceResponse | null>(null);

  const villeFiltre = useVilleFiltre();
  const biensQuery = useBiensServicesQuery({ ...villeFiltre, page, size: 20, sort: "idBienService,desc", recherche: recherche || undefined });
  const compteurs = useCompteursStatut(useBiensServicesQuery, { ...villeFiltre, recherche: recherche || undefined }, ["DISPONIBLE", "RESERVEE", "LOUEE", "EN_MAINTENANCE"] as const, "disponibilite");
  const createMutation = useCreateBienServiceMutation();
  const [photos, setPhotos] = useState<File[]>([]);
  const { attach: attachPhotos, isPending: photosPending } = useAttachPhotos();
  const updateMutation = useUpdateBienServiceMutation();
  const disponibiliteMutation = useUpdateDisponibiliteBienServiceMutation();
  const deleteMutation = useDeleteBienServiceMutation();

  const createForm = useForm<
    BienServiceCreateFormInput,
    unknown,
    BienServiceCreateFormValues
  >({ resolver: zodResolver(bienServiceCreateSchema) });
  const editForm = useForm<
    BienServiceEditFormInput,
    unknown,
    BienServiceEditFormValues
  >({ resolver: zodResolver(bienServiceEditSchema) });

  // Gestionnaire et catégorie sont choisis via une recherche côté serveur (RemoteCombobox)
  const gestionnaireChoisi = createForm.watch("idGestionnaire");
  const secteurCreation = createForm.watch("idSecteur");
  const secteurEdition = editForm.watch("idSecteur");
  const categorieCreation = createForm.watch("idCategorie");
  const categorieEdition = editForm.watch("idCategorie");

  // Recherche et pagination sont appliquées côté serveur
  const biens = biensQuery.data?.content ?? [];

  async function onCreate(values: BienServiceCreateFormValues) {
    try {
      const bien = await createMutation.mutateAsync(values);
      await attachPhotos("BIEN_SERVICE", bien.idBienService, photos);
      toast.success("Bien ou service créé.");
      createForm.reset({});
      setPhotos([]);
      setCreateOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Création impossible.",
      );
    }
  }

  function openEdit(bien: BienServiceResponse) {
    setEditing(bien);
    editForm.reset({
      idSecteur: bien.idSecteur,
      idCategorie: bien.idCategorie,
      libelle: bien.libelle,
      description: bien.description ?? "",
      prixJournalier: bien.prixJournalier ?? undefined,
      prixMensuel: bien.prixMensuel ?? undefined,
    });
  }

  async function onEdit(values: BienServiceEditFormValues) {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        id: editing.idBienService,
        body: values,
      });
      toast.success("Bien ou service mis à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
      );
    }
  }

  function openStatut(bien: BienServiceResponse) {
    setChangingStatut(bien);
    setNouveauStatut("");
  }

  async function handleChangeStatut() {
    if (!changingStatut || !nouveauStatut) return;
    try {
      await disponibiliteMutation.mutateAsync({
        id: changingStatut.idBienService,
        body: { disponibilite: nouveauStatut },
      });
      toast.success("Disponibilité mise à jour.");
      setChangingStatut(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Changement de disponibilité impossible.",
      );
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.idBienService);
      toast.success("Bien ou service supprimé.");
      setDeleting(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Suppression impossible.",
      );
    }
  }

  const columns: DataTableColumn<BienServiceResponse>[] = [
    {
      key: "libelle",
      header: "Bien / service",
      render: (b) => (
        <span className="flex items-center gap-2">
          <Package
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {b.libelle}
        </span>
      ),
    },
    {
      key: "categorie",
      header: "Catégorie",
      render: (b) => b.libelleCategorie,
    },
    { key: "secteur", header: "Secteur", render: (b) => b.nomSecteur },
    {
      key: "prix",
      header: "Prix",
      align: "right",
      render: (b) =>
        b.prixJournalier
          ? `${formatMontant(b.prixJournalier)} / jour`
          : formatMontant(b.prixMensuel),
    },
    {
      key: "statut",
      header: "Disponibilité",
      render: (b) => <StatutBadge statut={b.disponibilite} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (b) => {
        const items: ActionGroupItem[] = [
          {
            label: "Voir le détail",
            text: "Détails",
            icon: <Eye size={15} aria-hidden="true" />,
            onClick: () => setDetail(b),
          },
          {
            label: "Modifier",
            text: "Modifier",
            icon: <Edit2 size={15} aria-hidden="true" />,
            onClick: () => openEdit(b),
          },
          ...(STATUT_TRANSITIONS[b.disponibilite].length > 0
            ? [
                {
                  label: "Changer la disponibilité",
                  text: "Statut",
                  icon: <Settings2 size={15} aria-hidden="true" />,
                  onClick: () => openStatut(b),
                },
              ]
            : []),
          {
            label: "Supprimer",
            text: "Supprimer",
            icon: <Trash2 size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => setDeleting(b),
          },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <BienServiceDetailModalFromData
        bien={detail}
        onClose={() => setDetail(null)}
      />
      <PageHeader
        tone="indigo"
        title="Biens & services"
        description="Les biens et services proposés à la location par l'agence."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => {
              createForm.reset({});
              setCreateOpen(true);
            }}
          >
            Nouveau bien/service
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={["DISPONIBLE", "RESERVEE", "LOUEE", "EN_MAINTENANCE"] as const} />

      {biensQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les biens et services"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un bien, une catégorie, un secteur…"
              ariaLabel="Rechercher parmi les biens et services"
            />
          </div>
          <DataTable
            data={biens}
            columns={columns}
            keyExtractor={(b) => b.idBienService}
            loading={biensQuery.isLoading}
            emptyMessage={
              search
                ? "Aucun bien ou service ne correspond à votre recherche"
                : "Aucun bien ou service enregistré pour le moment"
            }
          />
          {biensQuery.data && (
            <Pagination
              currentPage={biensQuery.data.page.number}
              totalPages={biensQuery.data.page.totalPages}
              totalElements={biensQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPhotos([]);
        }}
        title="Nouveau bien/service"
        titleTone="indigo"
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit(onCreate)}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Libellé"
              required
              error={createForm.formState.errors.libelle?.message}
              {...createForm.register("libelle")}
            />
            <RemoteCombobox
              label="Gestionnaire"
              required
              placeholder="Rechercher un agent (nom, email)"
              useOptions={useGestionnairesOptions}
              value={gestionnaireChoisi}
              error={createForm.formState.errors.idGestionnaire?.message}
              {...createForm.register("idGestionnaire")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RemoteCombobox
              label="Secteur"
              required
              placeholder="Rechercher un secteur (nom, code, ville)"
              useOptions={useSecteursOptions}
              value={secteurCreation}
              error={createForm.formState.errors.idSecteur?.message}
              {...createForm.register("idSecteur")}
            />
            <RemoteCombobox
              label="Catégorie"
              required
              placeholder="Rechercher une catégorie"
              useOptions={useCategoriesOptions}
              value={categorieCreation}
              error={createForm.formState.errors.idCategorie?.message}
              {...createForm.register("idCategorie")}
            />
          </div>
          <Textarea
            label="Description"
            {...createForm.register("description")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prix journalier (F CFA)"
              type="number"
              min={0}
              {...createForm.register("prixJournalier")}
            />
            <Input
              label="Prix mensuel (F CFA)"
              type="number"
              min={0}
              {...createForm.register("prixMensuel")}
            />
          </div>
          <PhotoPicker files={photos} onChange={setPhotos} />
          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || photosPending}
          >
            Créer le bien/service
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Modifier - ${editing.libelle}` : "Modifier"}
        titleTone="indigo"
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit(onEdit)}
          noValidate
        >
          <Input
            label="Libellé"
            required
            error={editForm.formState.errors.libelle?.message}
            {...editForm.register("libelle")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RemoteCombobox
              key={editing?.idBienService}
              label="Secteur"
              required
              placeholder="Rechercher un secteur (nom, code, ville)"
              useOptions={useSecteursOptions}
              value={secteurEdition}
              initialOption={editing ? { value: editing.idSecteur, label: editing.nomSecteur } : undefined}
              error={editForm.formState.errors.idSecteur?.message}
              {...editForm.register("idSecteur")}
            />
            <RemoteCombobox
              key={editing?.idBienService}
              label="Catégorie"
              required
              placeholder="Rechercher une catégorie"
              useOptions={useCategoriesOptions}
              value={categorieEdition}
              initialOption={
                editing ? { value: editing.idCategorie, label: editing.libelleCategorie } : undefined
              }
              error={editForm.formState.errors.idCategorie?.message}
              {...editForm.register("idCategorie")}
            />
          </div>
          <Textarea label="Description" {...editForm.register("description")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prix journalier (F CFA)"
              type="number"
              min={0}
              {...editForm.register("prixJournalier")}
            />
            <Input
              label="Prix mensuel (F CFA)"
              type="number"
              min={0}
              {...editForm.register("prixMensuel")}
            />
          </div>
          {editing && (
            <PhotoManager
              entiteType="BIEN_SERVICE"
              entiteId={editing.idBienService}
            />
          )}
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={changingStatut !== null}
        onClose={() => setChangingStatut(null)}
        title="Changer la disponibilité"
        titleTone="indigo"
      >
        {changingStatut && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Disponibilité actuelle :{" "}
              <StatutBadge statut={changingStatut.disponibilite} />
            </p>
            <Select
              label="Nouvelle disponibilité"
              placeholder="Sélectionner"
              value={nouveauStatut}
              onChange={(e) =>
                setNouveauStatut(e.target.value as StatutBienService)
              }
              options={STATUT_TRANSITIONS[changingStatut.disponibilite].map(
                (s) => ({ value: s, label: statutLabel(s) }),
              )}
            />
            <Button
              fullWidth
              disabled={!nouveauStatut}
              loading={disponibiliteMutation.isPending}
              onClick={handleChangeStatut}
            >
              Confirmer
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer ce bien/service ?"
        titleTone="indigo"
      >
        {deleting && deleting.disponibilite === "LOUEE" ? (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>
                Impossible de supprimer <strong>{deleting.libelle}</strong> : il
                est actuellement loué. Attendez la fin de la location en cours
                avant de le supprimer.
              </p>
            </div>
            <Button
              variant="secondary"
              fullWidth
              className="mt-4"
              onClick={() => setDeleting(null)}
            >
              Fermer
            </Button>
          </>
        ) : (
          deleting && (
            <>
              <p className="text-sm text-slate-600">
                Vous êtes sur le point de supprimer{" "}
                <strong>{deleting.libelle}</strong>. Cette action est
                irréversible.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeleting(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  Supprimer
                </Button>
              </div>
            </>
          )
        )}
      </Modal>
    </div>
  );
}
