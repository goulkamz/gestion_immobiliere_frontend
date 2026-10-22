import { INDICATION_SECTEUR, libelleVille, separerVille, villeInitiale } from "@/utils/ville";
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
  Megaphone,
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
  SearchInput,
  Select,
  StatutBadge,
  Textarea,
  VilleFields,
  AnnonceDetailModal,
} from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useAnnoncesQuery } from "@/hooks/queries/usePublicCatalog";
import {
  useCreateAnnonceMutation,
  useDeleteAnnonceMutation,
  useUpdateAnnonceMutation,
  useUpdateStatutAnnonceMutation,
} from "@/hooks/queries/useAnnoncesAgent";
import {
  annonceSchema,
  type AnnonceFormInput,
  type AnnonceFormValues,
} from "../schemas";
import { statutLabel } from "@/utils/statut";
import { formatDate, formatMontant } from "@/utils/format";
import { useAttachPhotos } from "@/hooks/queries/useMedias";
import { useSessionStore, selectRole } from "@/store/sessionStore";
import { ApiError } from "@/api/http";
import type { AnnonceResponse, StatutAnnonce } from "@/api/types";

const STATUTS: StatutAnnonce[] = ["ACTIVE", "SUSPENDUE", "EXPIREE"];

export function AgentAnnoncesPage() {
  // La suppression d'une annonce est réservée à l'admin (règle du serveur)
  const isAdmin = useSessionStore(selectRole) === "ROLE_ADMIN";
  const [deleting, setDeleting] = useState<AnnonceResponse | null>(null);
  const [detail, setDetail] = useState<AnnonceResponse | null>(null);
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<StatutAnnonce | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AnnonceResponse | null>(null);
  const [changingStatut, setChangingStatut] = useState<AnnonceResponse | null>(
    null,
  );
  const [nouveauStatut, setNouveauStatut] = useState<StatutAnnonce | "">("");

  const villeFiltre = useVilleFiltre();
  const annoncesQuery = useAnnoncesQuery({
    ...villeFiltre,
    page,
    size: 20,
    sort: "datePublication,desc",
    statut: statutFilter || undefined,
    recherche: recherche || undefined,
  });
  const compteurs = useCompteursStatut(useAnnoncesQuery, { ...villeFiltre, recherche: recherche || undefined }, ["ACTIVE", "SUSPENDUE", "EXPIREE"] as const);
  const createMutation = useCreateAnnonceMutation();
  const [photos, setPhotos] = useState<File[]>([]);
  const { attach: attachPhotos, isPending: photosPending } = useAttachPhotos();
  const updateMutation = useUpdateAnnonceMutation();
  const statutMutation = useUpdateStatutAnnonceMutation();
  const deleteMutation = useDeleteAnnonceMutation();

  const [publierImmediatement, setPublierImmediatement] = useState(true);
  const createForm = useForm<AnnonceFormInput, unknown, AnnonceFormValues>({
    resolver: zodResolver(annonceSchema),
  });
  const editForm = useForm<AnnonceFormInput, unknown, AnnonceFormValues>({
    resolver: zodResolver(annonceSchema),
  });

  // Filtre statut, recherche et pagination sont appliqués côté serveur
  const annonces = annoncesQuery.data?.content ?? [];

  async function onCreate(values: AnnonceFormValues) {
    try {
      const { reste, choix } = separerVille(values);
      const annonce = await createMutation.mutateAsync({
        ...reste,
        ...choix,
        dateExpiration: `${values.dateExpiration}T00:00:00`,
      });
      // Le backend publie toujours l'annonce en ACTIVE à la création (pas de champ statut en entrée) :
      // on simule un "brouillon" en la suspendant immédiatement après si l'agent ne veut pas publier tout de suite.
      await attachPhotos("ANNONCE", annonce.idAnnonce, photos);
      if (!publierImmediatement) {
        await statutMutation.mutateAsync({
          id: annonce.idAnnonce,
          body: { statut: "SUSPENDUE" },
        });
      }
      toast.success(
        publierImmediatement
          ? "Annonce publiée."
          : "Annonce enregistrée (non publiée).",
      );
      createForm.reset({});
      setPhotos([]);
      setCreateOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Publication impossible.",
      );
    }
  }

  function openEdit(annonce: AnnonceResponse) {
    setEditing(annonce);
    editForm.reset({
      titre: annonce.titre,
      description: annonce.description ?? "",
      typeAnnonce: annonce.typeAnnonce ?? "",
      dateExpiration: annonce.dateExpiration.slice(0, 10),
      prix: annonce.prix ?? undefined,
      localisation: annonce.localisation ?? "",
      ...villeInitiale(annonce),
    });
  }

  async function onEdit(values: AnnonceFormValues) {
    if (!editing) return;
    try {
      const { reste, choix } = separerVille(values);
      await updateMutation.mutateAsync({
        id: editing.idAnnonce,
        body: {
          ...reste,
          ...choix,
          dateExpiration: `${values.dateExpiration}T00:00:00`,
        },
      });
      toast.success("Annonce mise à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
      );
    }
  }

  function openStatut(annonce: AnnonceResponse) {
    setChangingStatut(annonce);
    setNouveauStatut("");
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.idAnnonce);
      toast.success("Annonce supprimée.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible.");
    }
    setDeleting(null);
  }

  async function handleChangeStatut() {
    if (!changingStatut || !nouveauStatut) return;
    try {
      await statutMutation.mutateAsync({
        id: changingStatut.idAnnonce,
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

  const columns: DataTableColumn<AnnonceResponse>[] = [
    {
      key: "titre",
      header: "Titre",
      render: (a) => (
        <span className="flex items-center gap-2">
          <Megaphone
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {a.titre}
        </span>
      ),
    },
    { key: "type", header: "Type", render: (a) => a.typeAnnonce ?? "-" },
    {
      key: "prix",
      header: "Prix",
      align: "right",
      render: (a) => formatMontant(a.prix),
    },
    {
      key: "ville",
      header: "Ville",
      render: (a) => libelleVille(a),
    },
    {
      key: "localisation",
      header: "Localisation",
      render: (a) => a.localisation ?? "-",
    },
    {
      key: "expiration",
      header: "Expire le",
      render: (a) => formatDate(a.dateExpiration),
    },
    {
      key: "statut",
      header: "Statut",
      render: (a) => <StatutBadge statut={a.statut} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => {
        const items: ActionGroupItem[] = [
          {
            label: "Voir le détail",
            text: "Détails",
            icon: <Eye size={15} aria-hidden="true" />,
            onClick: () => setDetail(a),
          },
          {
            label: "Modifier",
            text: "Modifier",
            icon: <Edit2 size={15} aria-hidden="true" />,
            onClick: () => openEdit(a),
          },
          {
            label: "Changer le statut",
            text: "Statut",
            icon: <Settings2 size={15} aria-hidden="true" />,
            onClick: () => openStatut(a),
          },
          ...(isAdmin
            ? [
                {
                  label: "Supprimer",
                  text: "Supprimer",
                  icon: <Trash2 size={15} aria-hidden="true" />,
                  tone: "danger" as const,
                  onClick: () => setDeleting(a),
                },
              ]
            : []),
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <AnnonceDetailModal annonce={detail} onClose={() => setDetail(null)} />
      <PageHeader
        tone="indigo"
        title="Annonces"
        description="Les annonces publiées par l'agence."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => {
              createForm.reset({});
              setPublierImmediatement(true);
              setCreateOpen(true);
            }}
          >
            Nouvelle annonce
          </Button>
        }
      />

      <CompteursStatut compteurs={compteurs} statuts={["ACTIVE", "SUSPENDUE", "EXPIREE"] as const} />

      {annoncesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les annonces"
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
                  setStatutFilter(e.target.value as StatutAnnonce | "");
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
                placeholder="Rechercher un titre, un type, un lieu…"
                ariaLabel="Rechercher parmi les annonces"
              />
            </div>
          </div>
          <DataTable
            data={annonces}
            columns={columns}
            keyExtractor={(a) => a.idAnnonce}
            loading={annoncesQuery.isLoading}
            emptyMessage={
              search || statutFilter
                ? "Aucune annonce ne correspond à votre recherche"
                : "Aucune annonce publiée pour le moment"
            }
          />
          {annoncesQuery.data && (
            <Pagination
              currentPage={annoncesQuery.data.page.number}
              totalPages={annoncesQuery.data.page.totalPages}
              totalElements={annoncesQuery.data.page.totalElements}
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
        title="Nouvelle annonce"
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit(onCreate)}
          noValidate
        >
          <Input
            label="Titre"
            required
            error={createForm.formState.errors.titre?.message}
            {...createForm.register("titre")}
          />
          <Textarea
            label="Description"
            placeholder={INDICATION_SECTEUR}
            {...createForm.register("description")}
          />
          <VilleFields
            ville={createForm.register("ville")}
            villeAutre={createForm.register("villeAutre")}
            valeur={createForm.watch("ville")}
            erreurVille={createForm.formState.errors.ville?.message}
            erreurAutre={createForm.formState.errors.villeAutre?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type"
              placeholder="Maison, véhicule, service…"
              {...createForm.register("typeAnnonce")}
            />
            <Input
              label="Localisation"
              {...createForm.register("localisation")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prix (F CFA)"
              type="number"
              min={0}
              {...createForm.register("prix")}
            />
            <Input
              label="Date d'expiration"
              type="date"
              required
              error={createForm.formState.errors.dateExpiration?.message}
              {...createForm.register("dateExpiration")}
            />
          </div>
          <PhotoPicker files={photos} onChange={setPhotos} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={publierImmediatement}
              onChange={(e) => setPublierImmediatement(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Publier immédiatement
          </label>
          <Button
            type="submit"
            fullWidth
            loading={
              createMutation.isPending ||
              statutMutation.isPending ||
              photosPending
            }
          >
            {publierImmediatement
              ? "Publier l'annonce"
              : "Enregistrer sans publier"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Modifier - ${editing.titre}` : "Modifier"}
        titleTone="indigo"
      >
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit(onEdit)}
          noValidate
        >
          <Input
            label="Titre"
            required
            error={editForm.formState.errors.titre?.message}
            {...editForm.register("titre")}
          />
          <Textarea label="Description" placeholder={INDICATION_SECTEUR} {...editForm.register("description")} />
          <VilleFields
            ville={editForm.register("ville")}
            villeAutre={editForm.register("villeAutre")}
            valeur={editForm.watch("ville")}
            erreurVille={editForm.formState.errors.ville?.message}
            erreurAutre={editForm.formState.errors.villeAutre?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type"
              placeholder="Maison, véhicule, service…"
              {...editForm.register("typeAnnonce")}
            />
            <Input
              label="Localisation"
              {...editForm.register("localisation")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prix (F CFA)"
              type="number"
              min={0}
              {...editForm.register("prix")}
            />
            <Input
              label="Date d'expiration"
              type="date"
              required
              error={editForm.formState.errors.dateExpiration?.message}
              {...editForm.register("dateExpiration")}
            />
          </div>
          {editing && (
            <PhotoManager entiteType="ANNONCE" entiteId={editing.idAnnonce} />
          )}
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer cette annonce ?"
        titleTone="indigo"
      >
        {deleting && (
          <>
            <p className="text-sm text-slate-600">
              Vous êtes sur le point de supprimer <strong>{deleting.titre}</strong>. Elle disparaît du site et de cette liste.
              Pour la retirer du site sans la perdre, passez plutôt son statut à « Suspendue ».
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button variant="danger" className="flex-1" loading={deleteMutation.isPending} onClick={handleDelete}>
                Supprimer
              </Button>
            </div>
          </>
        )}
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
              onChange={(e) =>
                setNouveauStatut(e.target.value as StatutAnnonce)
              }
              options={STATUTS.filter((s) => s !== changingStatut.statut).map(
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
    </div>
  );
}
