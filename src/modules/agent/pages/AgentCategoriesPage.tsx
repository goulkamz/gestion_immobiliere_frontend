import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Edit2, Plus, Tags, Trash2 } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, SearchInput, Textarea } from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import {
  useCategoriesQuery,
  useCreateCategorieMutation,
  useDeleteCategorieMutation,
  useUpdateCategorieMutation,
} from "@/hooks/queries/useCategories";
import { categorieSchema, type CategorieFormInput, type CategorieFormValues } from "../schemas";
import { ApiError } from "@/api/http";
import type { CategorieResponse } from "@/api/types";

export function AgentCategoriesPage() {
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CategorieResponse | null>(null);
  const [deleting, setDeleting] = useState<CategorieResponse | null>(null);

  const categoriesQuery = useCategoriesQuery({ page, size: 20, sort: "idCategorie,desc", recherche: recherche || undefined });
  const createMutation = useCreateCategorieMutation();
  const updateMutation = useUpdateCategorieMutation();
  const deleteMutation = useDeleteCategorieMutation();

  // Le serveur renvoie le nombre de biens/services rattachés et refuse (409) la suppression d'une catégorie utilisée
  const categorieUtilisee = (deleting?.nbBiensServices ?? 0) > 0;

  const createForm = useForm<CategorieFormInput, unknown, CategorieFormValues>({ resolver: zodResolver(categorieSchema) });
  const editForm = useForm<CategorieFormInput, unknown, CategorieFormValues>({ resolver: zodResolver(categorieSchema) });

  // Recherche et pagination sont appliquées côté serveur
  const categories = categoriesQuery.data?.content ?? [];

  async function onCreate(values: CategorieFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Catégorie créée.");
      createForm.reset({});
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Création impossible.");
    }
  }

  function openEdit(categorie: CategorieResponse) {
    setEditing(categorie);
    editForm.reset({ libelle: categorie.libelle, description: categorie.description ?? "" });
  }

  async function onEdit(values: CategorieFormValues) {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.idCategorie, body: values });
      toast.success("Catégorie mise à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible.");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.idCategorie);
      toast.success("Catégorie supprimée.");
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible.");
    }
  }

  const columns: DataTableColumn<CategorieResponse>[] = [
    {
      key: "libelle",
      header: "Libellé",
      render: (c) => (
        <span className="flex items-center gap-2">
          <Tags size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {c.libelle}
        </span>
      ),
    },
    { key: "description", header: "Description", render: (c) => c.description ?? "-" },
    { key: "nbBiensServices", header: "Biens et services", align: "right", render: (c) => c.nbBiensServices },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => {
        const items: ActionGroupItem[] = [
          { label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(c) },
          { label: "Supprimer", text: "Supprimer", icon: <Trash2 size={15} aria-hidden="true" />, tone: "danger", onClick: () => setDeleting(c) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Catégories"
        description="Les catégories utilisées pour classer les biens et services."
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => {
              createForm.reset({});
              setCreateOpen(true);
            }}
          >
            Nouvelle catégorie
          </Button>
        }
      />

      {categoriesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les catégories"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une catégorie…" ariaLabel="Rechercher parmi les catégories" />
          </div>
          <DataTable
            data={categories}
            columns={columns}
            keyExtractor={(c) => c.idCategorie}
            loading={categoriesQuery.isLoading}
            emptyMessage={search ? "Aucune catégorie ne correspond à votre recherche" : "Aucune catégorie enregistrée pour le moment"}
          />
          {categoriesQuery.data && (
            <Pagination
              currentPage={categoriesQuery.data.page.number}
              totalPages={categoriesQuery.data.page.totalPages}
              totalElements={categoriesQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle catégorie" titleTone="indigo">
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
          <Input label="Libellé" required error={createForm.formState.errors.libelle?.message} {...createForm.register("libelle")} />
          <Textarea label="Description" {...createForm.register("description")} />
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Créer la catégorie
          </Button>
        </form>
      </Modal>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing ? `Modifier - ${editing.libelle}` : "Modifier"} titleTone="indigo">
        <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)} noValidate>
          <Input label="Libellé" required error={editForm.formState.errors.libelle?.message} {...editForm.register("libelle")} />
          <Textarea label="Description" {...editForm.register("description")} />
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>

      <Modal isOpen={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer cette catégorie ?" titleTone="indigo">
        {deleting && categorieUtilisee ? (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                Impossible de supprimer <strong>{deleting.libelle}</strong> : au moins un bien ou service utilise encore
                cette catégorie. Changez d&apos;abord sa catégorie ou supprimez-le.
              </p>
            </div>
            <Button variant="secondary" fullWidth className="mt-4" onClick={() => setDeleting(null)}>
              Fermer
            </Button>
          </>
        ) : (
          deleting && (
            <>
              <p className="text-sm text-slate-600">
                Vous êtes sur le point de supprimer <strong>{deleting.libelle}</strong>. Cette action est irréversible.
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
          )
        )}
      </Modal>
    </div>
  );
}
