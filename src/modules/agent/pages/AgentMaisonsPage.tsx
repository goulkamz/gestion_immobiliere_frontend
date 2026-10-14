import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  DoorOpen,
  Edit2,
  Eye,
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
  SearchInput,
  Textarea,
  RemoteCombobox,
  Select,
  StatutBadge,
  MaisonDetailModalFromData,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useCoursOptions } from "@/hooks/useOptionsSelection";
import {
  useMaisonsGestionQuery,
  useCreateMaisonMutation,
  useDeleteMaisonMutation,
  useUpdateMaisonMutation,
  useUpdateStatutMaisonMutation,
} from "@/hooks/queries/useMaisons";
import {
  maisonSchema,
  type MaisonFormInput,
  type MaisonFormValues,
} from "../schemas";
import { statutLabel } from "@/utils/statut";
import { formatMontant } from "@/utils/format";
import { useAttachPhotos } from "@/hooks/queries/useMedias";
import { ApiError } from "@/api/http";
import {
  MAISON_STATUT_TRANSITIONS,
  type MaisonResponse,
  type StatutMaison,
} from "@/api/types";

export function AgentMaisonsPage() {
  const [detail, setDetail] = useState<MaisonResponse | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MaisonResponse | null>(null);
  const [changingStatut, setChangingStatut] = useState<MaisonResponse | null>(
    null,
  );
  const [nouveauStatut, setNouveauStatut] = useState<StatutMaison | "">("");
  const [deleting, setDeleting] = useState<MaisonResponse | null>(null);

  const maisonsQuery = useMaisonsGestionQuery({ size: 100 });
  const compteurs = useCompteursStatut(useMaisonsGestionQuery, {}, ["DISPONIBLE", "RESERVEE", "LOUEE", "EN_MAINTENANCE"] as const);
  const createMutation = useCreateMaisonMutation();
  const [photos, setPhotos] = useState<File[]>([]);
  const { attach: attachPhotos, isPending: photosPending } = useAttachPhotos();
  const updateMutation = useUpdateMaisonMutation();
  const statutMutation = useUpdateStatutMaisonMutation();
  const deleteMutation = useDeleteMaisonMutation();

  const createForm = useForm<MaisonFormInput, unknown, MaisonFormValues>({
    resolver: zodResolver(maisonSchema),
  });
  const editForm = useForm<MaisonFormInput, unknown, MaisonFormValues>({
    resolver: zodResolver(maisonSchema),
  });
  // La cour est choisie via une recherche côté serveur (RemoteCombobox) : aucune liste plafonnée
  const courChoisie = createForm.watch("idCour");

  const filtered = useMemo(() => {
    const list = maisonsQuery.data?.content ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((m) =>
      [m.nomCommunMaison, m.typeMaison, m.referenceCour]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [maisonsQuery.data, search]);

  async function onCreate(values: MaisonFormValues) {
    try {
      const maison = await createMutation.mutateAsync(values);
      await attachPhotos("MAISON", maison.idMaison, photos);
      toast.success("Maison créée.");
      createForm.reset({});
      setPhotos([]);
      setCreateOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Création impossible.",
      );
    }
  }

  function openEdit(maison: MaisonResponse) {
    setEditing(maison);
    editForm.reset({
      idCour: maison.idCour,
      typeMaison: maison.typeMaison ?? "",
      nomCommunMaison: maison.nomCommunMaison ?? "",
      nombrePiece: maison.nombrePiece ?? undefined,
      loyer: maison.loyer ?? undefined,
      caution: maison.caution ?? undefined,
      avance: maison.avance ?? undefined,
      nombreMoisCaution: maison.nombreMoisCaution ?? undefined,
      description: maison.description ?? "",
    });
  }

  async function onEdit(values: MaisonFormValues) {
    if (!editing) return;
    try {
      const { idCour: _idCour, ...body } = values;
      await updateMutation.mutateAsync({ id: editing.idMaison, body });
      toast.success("Maison mise à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
      );
    }
  }

  function openStatut(maison: MaisonResponse) {
    setChangingStatut(maison);
    setNouveauStatut("");
  }

  async function handleChangeStatut() {
    if (!changingStatut || !nouveauStatut) return;
    try {
      await statutMutation.mutateAsync({
        id: changingStatut.idMaison,
        body: { statut: nouveauStatut },
      });
      toast.success("Statut mis à jour.");
      setChangingStatut(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Changement de statut impossible.",
      );
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.idMaison);
      toast.success("Maison supprimée.");
      setDeleting(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Suppression impossible.",
      );
    }
  }

  const columns: DataTableColumn<MaisonResponse>[] = [
    {
      key: "nom",
      header: "Maison",
      render: (m) => (
        <span className="flex items-center gap-2">
          <DoorOpen
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {m.nomCommunMaison ?? `Maison #${m.idMaison}`}
        </span>
      ),
    },
    { key: "cour", header: "Cour", render: (m) => m.referenceCour },
    { key: "type", header: "Type", render: (m) => m.typeMaison ?? "-" },
    {
      key: "pieces",
      header: "Pièces",
      align: "right",
      render: (m) => m.nombrePiece ?? "-",
    },
    {
      key: "loyer",
      header: "Loyer",
      align: "right",
      render: (m) => formatMontant(m.loyer),
    },
    {
      key: "statut",
      header: "Statut",
      render: (m) => <StatutBadge statut={m.statut} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (m) => {
        const items: ActionGroupItem[] = [
          {
            label: "Voir le détail",
            text: "Détails",
            icon: <Eye size={15} aria-hidden="true" />,
            onClick: () => setDetail(m),
          },
          {
            label: "Modifier",
            text: "Modifier",
            icon: <Edit2 size={15} aria-hidden="true" />,
            onClick: () => openEdit(m),
          },
          // Maison réservée ou louée : statut piloté par la réservation / le contrat
          ...(MAISON_STATUT_TRANSITIONS[m.statut].length > 0
            ? [
                {
                  label: "Changer le statut",
                  text: "Statut",
                  icon: <Settings2 size={15} aria-hidden="true" />,
                  onClick: () => openStatut(m),
                },
              ]
            : []),
          {
            label: "Supprimer",
            text: "Supprimer",
            icon: <Trash2 size={15} aria-hidden="true" />,
            tone: "danger",
            onClick: () => setDeleting(m),
          },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <MaisonDetailModalFromData
        maison={detail}
        onClose={() => setDetail(null)}
      />
      <PageHeader
        tone="indigo"
        title="Maisons"
        description="Les maisons du patrimoine géré par l'agence."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => {
              createForm.reset({});
              setCreateOpen(true);
            }}
          >
            Nouvelle maison
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={["DISPONIBLE", "RESERVEE", "LOUEE", "EN_MAINTENANCE"] as const} />

      {maisonsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les maisons"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une maison, un type, une cour…"
              ariaLabel="Rechercher parmi les maisons"
            />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(m) => m.idMaison}
            loading={maisonsQuery.isLoading}
            emptyMessage={
              search
                ? "Aucune maison ne correspond à votre recherche"
                : "Aucune maison enregistrée pour le moment"
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
        title="Nouvelle maison"
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit(onCreate)}
          noValidate
        >
          <RemoteCombobox
            label="Cour"
            required
            placeholder="Rechercher une cour (référence, propriétaire)"
            useOptions={useCoursOptions}
            value={courChoisie}
            error={createForm.formState.errors.idCour?.message}
            {...createForm.register("idCour")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type"
              placeholder="Studio, F2, Villa…"
              {...createForm.register("typeMaison")}
            />
            <Input
              label="Nom commun"
              {...createForm.register("nomCommunMaison")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de pièces"
              type="number"
              min={0}
              {...createForm.register("nombrePiece")}
            />
            <Input
              label="Mois de caution requis"
              type="number"
              min={0}
              {...createForm.register("nombreMoisCaution")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Loyer (F CFA)"
              type="number"
              min={0}
              {...createForm.register("loyer")}
            />
            <Input
              label="Caution (F CFA)"
              type="number"
              min={0}
              {...createForm.register("caution")}
            />
            <Input
              label="Avance (F CFA)"
              type="number"
              min={0}
              {...createForm.register("avance")}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="État des lieux, équipements, atouts…"
            rows={4}
            {...createForm.register("description")}
          />
          <PhotoPicker files={photos} onChange={setPhotos} />
          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || photosPending}
          >
            Créer la maison
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing
            ? `Modifier - ${editing.nomCommunMaison ?? editing.referenceCour}`
            : "Modifier"
        }
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit(onEdit)}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type"
              placeholder="Studio, F2, Villa…"
              {...editForm.register("typeMaison")}
            />
            <Input
              label="Nom commun"
              {...editForm.register("nomCommunMaison")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de pièces"
              type="number"
              min={0}
              {...editForm.register("nombrePiece")}
            />
            <Input
              label="Mois de caution requis"
              type="number"
              min={0}
              {...editForm.register("nombreMoisCaution")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Loyer (F CFA)"
              type="number"
              min={0}
              {...editForm.register("loyer")}
            />
            <Input
              label="Caution (F CFA)"
              type="number"
              min={0}
              {...editForm.register("caution")}
            />
            <Input
              label="Avance (F CFA)"
              type="number"
              min={0}
              {...editForm.register("avance")}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="État des lieux, équipements, atouts…"
            rows={4}
            {...editForm.register("description")}
          />
          {editing && (
            <PhotoManager entiteType="MAISON" entiteId={editing.idMaison} />
          )}
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={changingStatut !== null}
        onClose={() => setChangingStatut(null)}
        title="Changer le statut"
        titleTone="indigo"
      >
        {changingStatut && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Statut actuel : <StatutBadge statut={changingStatut.statut} />
            </p>
            <Select
              label="Nouveau statut"
              placeholder="Sélectionner"
              value={nouveauStatut}
              onChange={(e) => setNouveauStatut(e.target.value as StatutMaison)}
              options={MAISON_STATUT_TRANSITIONS[changingStatut.statut].map(
                (s) => ({ value: s, label: statutLabel(s) }),
              )}
            />
            <Button
              fullWidth
              disabled={!nouveauStatut}
              loading={statutMutation.isPending}
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
        title="Supprimer cette maison ?"
        titleTone="indigo"
      >
        {deleting && deleting.statut === "LOUEE" ? (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>
                Impossible de supprimer{" "}
                <strong>
                  {deleting.nomCommunMaison ?? `Maison #${deleting.idMaison}`}
                </strong>{" "}
                : elle est actuellement louée. Résiliez d&apos;abord le contrat
                de location en cours.
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
                <strong>
                  {deleting.nomCommunMaison ?? `Maison #${deleting.idMaison}`}
                </strong>
                . Cette action est irréversible.
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
