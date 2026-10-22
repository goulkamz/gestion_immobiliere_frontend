import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Edit2, Globe, Plus, Trash2 } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, SearchInput } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { ApiError } from "@/api/http";
import type { PaysResponse } from "@/api/types";
import { usePaysAdminQuery, usePaysMutations } from "@/hooks/queries/useLocalisationAdmin";
import { paysSchema, type PaysFormValues } from "./schemas";
import { SuppressionModal } from "./SuppressionModal";

export function PaysSection() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaysResponse | null>(null);
  const [deleting, setDeleting] = useState<PaysResponse | null>(null);

  const paysQuery = usePaysAdminQuery();
  const { create, update, remove } = usePaysMutations();
  const form = useForm<PaysFormValues>({ resolver: zodResolver(paysSchema) });

  const texte = search.trim().toLowerCase();
  const pays = (paysQuery.data?.content ?? []).filter(
    (p) => !texte || p.nomPays.toLowerCase().includes(texte) || p.codePays.toLowerCase().includes(texte),
  );

  function openCreate() {
    setEditing(null);
    form.reset({ codePays: "", nomPays: "" });
    setFormOpen(true);
  }

  function openEdit(p: PaysResponse) {
    setEditing(p);
    form.reset({ codePays: p.codePays, nomPays: p.nomPays });
    setFormOpen(true);
  }

  async function onSubmit(values: PaysFormValues) {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.idPays, body: values });
        toast.success("Pays mis à jour.");
      } else {
        await create.mutateAsync(values);
        toast.success("Pays créé.");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  async function onDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.idPays);
      toast.success("Pays supprimé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible.");
    }
    setDeleting(null);
  }

  const columns: DataTableColumn<PaysResponse>[] = [
    {
      key: "nomPays",
      header: "Pays",
      render: (p) => (
        <span className="flex items-center gap-2">
          <Globe size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {p.nomPays}
        </span>
      ),
    },
    { key: "codePays", header: "Code", render: (p) => p.codePays },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => {
        const items: ActionGroupItem[] = [
          { label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(p) },
          { label: "Supprimer", text: "Supprimer", icon: <Trash2 size={15} aria-hidden="true" />, tone: "danger", onClick: () => setDeleting(p) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  if (paysQuery.isError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} />}
        title="Impossible de charger les pays"
        description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un pays…" ariaLabel="Rechercher parmi les pays" />
        </div>
        <Button variant="accent" icon={<Plus size={16} />} onClick={openCreate}>
          Nouveau pays
        </Button>
      </div>
      <DataTable
        data={pays}
        columns={columns}
        keyExtractor={(p) => p.idPays}
        loading={paysQuery.isLoading}
        emptyMessage={search ? "Aucun pays ne correspond à votre recherche" : "Aucun pays enregistré pour le moment"}
      />

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Modifier - ${editing.nomPays}` : "Nouveau pays"} titleTone="indigo">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Input label="Nom du pays" required error={form.formState.errors.nomPays?.message} {...form.register("nomPays")} />
          <Input label="Code" required error={form.formState.errors.codePays?.message} {...form.register("codePays")} />
          <Button type="submit" fullWidth loading={create.isPending || update.isPending}>
            {editing ? "Enregistrer" : "Créer le pays"}
          </Button>
        </form>
      </Modal>

      <SuppressionModal
        nom={deleting?.nomPays ?? null}
        titre="Supprimer ce pays ?"
        precision="Un pays qui contient encore des villes ne peut pas être supprimé."
        loading={remove.isPending}
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
