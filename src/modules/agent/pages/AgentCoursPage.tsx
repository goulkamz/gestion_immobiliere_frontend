import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Building2,
  Edit2,
  Eye,
  MapPin,
  Plus,
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
  SearchInput,
  RemoteCombobox,
  CourDetailModal,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import {
  useCoursQuery,
  useCreateCourMutation,
  useUpdateCourMutation,
  useDeleteCourMutation,
} from "@/hooks/queries/useCours";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useMaisonsGestionQuery } from "@/hooks/queries/useMaisons";
import { useAttachPhotos } from "@/hooks/queries/useMedias";
import { useBailleursOptions, useSecteursOptions } from "@/hooks/useOptionsSelection";
import {
  courCreateSchema,
  courEditSchema,
  type CourCreateFormInput,
  type CourCreateFormValues,
  type CourEditFormInput,
  type CourEditFormValues,
} from "../schemas";
import { ApiError } from "@/api/http";
import type { CourResponse } from "@/api/types";

/** Message de blocage de suppression, combinant les maisons restantes et/ou le mandat actif. */
function blocageCourMessage(
  maisonsCount: number,
  aUnMandatActif: boolean,
): string {
  const raisons: string[] = [];
  if (maisonsCount > 0)
    raisons.push(
      `elle contient encore ${maisonsCount} maison${maisonsCount > 1 ? "s" : ""}`,
    );
  if (aUnMandatActif) raisons.push("elle a un mandat de gestion actif");

  const actions: string[] = [];
  if (maisonsCount > 0)
    actions.push("supprimez d'abord les maisons (page Maisons)");
  if (aUnMandatActif) actions.push("résiliez d'abord le mandat (page Mandats)");

  return `${raisons.join(" et ")} - ${actions.join(" et ")}.`;
}

export function AgentCoursPage() {
  const [detail, setDetail] = useState<CourResponse | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CourResponse | null>(null);
  const [deleting, setDeleting] = useState<CourResponse | null>(null);
  const coursQuery = useCoursQuery({ size: 100 });
  const createMutation = useCreateCourMutation();
  const [photos, setPhotos] = useState<File[]>([]);
  const { attach: attachPhotos, isPending: photosPending } = useAttachPhotos();
  const updateMutation = useUpdateCourMutation();
  const deleteMutation = useDeleteCourMutation();

  // Vérifie les maisons et le mandat actif de la cour visée avant d'autoriser la suppression :
  // le backend ne bloque ni l'un ni l'autre, donc on le fait ici (comme pour une catégorie
  // encore utilisée par un bien/service).
  const maisonsDeLaCourQuery = useMaisonsGestionQuery(
    { idCour: deleting?.idCour ?? 0, size: 100 },
    { enabled: deleting !== null },
  );
  const maisonsCount = maisonsDeLaCourQuery.data?.page.totalElements ?? 0;
  const mandatActifQuery = useContratsMandatQuery(
    { idCour: deleting?.idCour ?? 0, statut: "ACTIF", size: 1 },
    { enabled: deleting !== null },
  );
  const aUnMandatActif = (mandatActifQuery.data?.page.totalElements ?? 0) > 0;

  const createForm = useForm<
    CourCreateFormInput,
    unknown,
    CourCreateFormValues
  >({ resolver: zodResolver(courCreateSchema) });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CourEditFormInput, unknown, CourEditFormValues>({
    resolver: zodResolver(courEditSchema),
  });

  // Le propriétaire est choisi via une recherche côté serveur (RemoteCombobox) : aucune liste plafonnée
  const proprietaireChoisi = createForm.watch("idProprietaire");
  const secteurCreation = createForm.watch("idSecteur");
  const secteurEdition = watch("idSecteur");

  const filtered = useMemo(() => {
    const list = coursQuery.data?.content ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((c) =>
      [c.referenceCour, c.lotCour, c.nomSecteur, c.nomProprietaire]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [coursQuery.data, search]);

  async function onCreate(values: CourCreateFormValues) {
    try {
      const cour = await createMutation.mutateAsync(values);
      await attachPhotos("COUR", cour.idCour, photos);
      toast.success("Cour créée.");
      createForm.reset({});
      setPhotos([]);
      setCreateOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Création impossible.",
      );
    }
  }

  function openEdit(cour: CourResponse) {
    setEditing(cour);
    reset({
      idSecteur: cour.idSecteur,
      referenceCour: cour.referenceCour,
      lotCour: cour.lotCour ?? "",
      numeroPorte: cour.numeroPorte ?? undefined,
    });
  }

  async function onSubmit(values: CourEditFormValues) {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.idCour, body: values });
      toast.success("Cour mise à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
      );
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.idCour);
      toast.success("Cour supprimée.");
      setDeleting(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Suppression impossible.",
      );
    }
  }

  const columns: DataTableColumn<CourResponse>[] = [
    {
      key: "reference",
      header: "Cour",
      render: (c) => (
        <span className="flex items-center gap-2">
          <Building2
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {c.referenceCour}
        </span>
      ),
    },
    { key: "lot", header: "Lot", render: (c) => c.lotCour ?? "-" },
    {
      key: "secteur",
      header: "Secteur",
      render: (c) => (
        <span className="flex items-center gap-2">
          <MapPin
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {c.nomSecteur}
        </span>
      ),
    },
    {
      key: "proprietaire",
      header: "Propriétaire",
      render: (c) => c.nomProprietaire,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => {
        const items: ActionGroupItem[] = [
          {
            label: "Voir le détail",
            text: "Détails",
            icon: <Eye size={15} aria-hidden="true" />,
            onClick: () => setDetail(c),
          },
          {
            label: "Modifier",
            text: "Modifier",
            icon: <Edit2 size={15} aria-hidden="true" />,
            onClick: () => openEdit(c),
          },
          {
            label: "Supprimer",
            text: "Supprimer",
            icon: <Trash2 size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => setDeleting(c),
          },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <CourDetailModal cour={detail} onClose={() => setDetail(null)} />
      <PageHeader
        tone="indigo"
        title="Cours"
        description="Les cours gérées par l'agence, tous propriétaires confondus."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => {
              createForm.reset({});
              setCreateOpen(true);
            }}
          >
            Nouvelle cour
          </Button>
        }
      />

      {coursQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les cours"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une cour, un secteur, un propriétaire…"
              ariaLabel="Rechercher parmi les cours"
            />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(c) => c.idCour}
            loading={coursQuery.isLoading}
            emptyMessage={
              search
                ? "Aucune cour ne correspond à votre recherche"
                : "Aucune cour enregistrée pour le moment"
            }
          />
        </>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPhotos([]);
        }}
        title="Nouvelle cour"
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit(onCreate)}
          noValidate
        >
          <RemoteCombobox
            label="Propriétaire (bailleur)"
            required
            placeholder="Rechercher un bailleur (nom, email)"
            useOptions={useBailleursOptions}
            value={proprietaireChoisi}
            error={createForm.formState.errors.idProprietaire?.message}
            {...createForm.register("idProprietaire")}
          />
          <RemoteCombobox
            label="Secteur"
            required
            placeholder="Rechercher un secteur (nom, code, ville)"
            useOptions={useSecteursOptions}
            value={secteurCreation}
            error={createForm.formState.errors.idSecteur?.message}
            {...createForm.register("idSecteur")}
          />
          <Input
            label="Référence"
            required
            error={createForm.formState.errors.referenceCour?.message}
            {...createForm.register("referenceCour")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Lot" {...createForm.register("lotCour")} />
            <Input
              label="Numéro de porte"
              type="number"
              min={0}
              {...createForm.register("numeroPorte")}
            />
          </div>
          <PhotoPicker files={photos} onChange={setPhotos} />
          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || photosPending}
          >
            Créer la cour
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Modifier - ${editing.referenceCour}` : "Modifier"}
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <RemoteCombobox
            key={editing?.idCour}
            label="Secteur"
            required
            placeholder="Rechercher un secteur (nom, code, ville)"
            useOptions={useSecteursOptions}
            value={secteurEdition}
            initialOption={editing ? { value: editing.idSecteur, label: editing.nomSecteur } : undefined}
            error={errors.idSecteur?.message}
            {...register("idSecteur")}
          />
          <Input
            label="Référence"
            required
            error={errors.referenceCour?.message}
            {...register("referenceCour")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Lot" {...register("lotCour")} />
            <Input
              label="Numéro de porte"
              type="number"
              min={0}
              {...register("numeroPorte")}
            />
          </div>
          {editing && (
            <PhotoManager entiteType="COUR" entiteId={editing.idCour} />
          )}
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer cette cour ?"
        titleTone="indigo"
      >
        {deleting && (maisonsCount > 0 || aUnMandatActif) ? (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>
                Impossible de supprimer{" "}
                <strong>{deleting.referenceCour}</strong> :{" "}
                {blocageCourMessage(maisonsCount, aUnMandatActif)}
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
                <strong>{deleting.referenceCour}</strong>. Cette action est
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
                  loading={
                    deleteMutation.isPending ||
                    maisonsDeLaCourQuery.isLoading ||
                    mandatActifQuery.isLoading
                  }
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
