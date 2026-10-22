import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Building2, Edit2, Plus, Trash2 } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, SearchInput, Select } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { ApiError } from "@/api/http";
import type { VilleResponse } from "@/api/types";
import { usePaysAdminQuery, useVillesAdminQuery, useVillesMutations } from "@/hooks/queries/useLocalisationAdmin";
import { villeSchema, type VilleFormInput, type VilleFormValues } from "./schemas";
import { SuppressionModal } from "./SuppressionModal";

export function VillesSection() {
  const [search, setSearch] = useState("");
  const [idPaysFiltre, setIdPaysFiltre] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VilleResponse | null>(null);
  const [deleting, setDeleting] = useState<VilleResponse | null>(null);

  const paysQuery = usePaysAdminQuery();
  const villesQuery = useVillesAdminQuery(idPaysFiltre ? { idPays: Number(idPaysFiltre) } : undefined);
  const { create, update, remove } = useVillesMutations();
  const form = useForm<VilleFormInput, unknown, VilleFormValues>({ resolver: zodResolver(villeSchema) });

  const optionsPays = (paysQuery.data?.content ?? []).map((p) => ({ value: p.idPays, label: p.nomPays }));
  const texte = search.trim().toLowerCase();
  const villes = (villesQuery.data?.content ?? []).filter(
    (v) => !texte || v.nomVille.toLowerCase().includes(texte) || v.codeVille.toLowerCase().includes(texte),
  );

  function openCreate() {
    setEditing(null);
    form.reset({ idPays: idPaysFiltre, codeVille: "", nomVille: "" });
    setFormOpen(true);
  }

  function openEdit(v: VilleResponse) {
    setEditing(v);
    form.reset({ idPays: v.idPays, codeVille: v.codeVille, nomVille: v.nomVille });
    setFormOpen(true);
  }

  async function onSubmit(values: VilleFormValues) {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.idVille, body: values });
        toast.success("Ville mise à jour.");
      } else {
        await create.mutateAsync(values);
        toast.success("Ville créée.");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  async function onDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.idVille);
      toast.success("Ville supprimée.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible.");
    }
    setDeleting(null);
  }

  const columns: DataTableColumn<VilleResponse>[] = [
    {
      key: "nomVille",
      header: "Ville",
      render: (v) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {v.nomVille}
        </span>
      ),
    },
    { key: "codeVille", header: "Code", render: (v) => v.codeVille },
    { key: "nomPays", header: "Pays", render: (v) => v.nomPays },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (v) => {
        const items: ActionGroupItem[] = [
          { label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(v) },
          { label: "Supprimer", text: "Supprimer", icon: <Trash2 size={15} aria-hidden="true" />, tone: "danger", onClick: () => setDeleting(v) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  if (villesQuery.isError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} />}
        title="Impossible de charger les villes"
        description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-xl flex-wrap gap-3">
          <div className="w-full max-w-xs">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une ville…" ariaLabel="Rechercher parmi les villes" />
          </div>
          <div className="w-full max-w-[14rem]">
            <Select
              aria-label="Filtrer par pays"
              options={optionsPays}
              placeholder="Tous les pays"
              value={idPaysFiltre}
              onChange={(e) => setIdPaysFiltre(e.target.value)}
            />
          </div>
        </div>
        <Button variant="accent" icon={<Plus size={16} />} onClick={openCreate}>
          Nouvelle ville
        </Button>
      </div>
      <DataTable
        data={villes}
        columns={columns}
        keyExtractor={(v) => v.idVille}
        loading={villesQuery.isLoading}
        emptyMessage={search || idPaysFiltre ? "Aucune ville ne correspond à votre recherche" : "Aucune ville enregistrée pour le moment"}
      />

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Modifier - ${editing.nomVille}` : "Nouvelle ville"} titleTone="indigo">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Select label="Pays" required options={optionsPays} placeholder="Choisir un pays" error={form.formState.errors.idPays?.message} {...form.register("idPays")} />
          <Input label="Nom de la ville" required error={form.formState.errors.nomVille?.message} {...form.register("nomVille")} />
          <Input label="Code" required error={form.formState.errors.codeVille?.message} {...form.register("codeVille")} />
          <Button type="submit" fullWidth loading={create.isPending || update.isPending}>
            {editing ? "Enregistrer" : "Créer la ville"}
          </Button>
        </form>
      </Modal>

      <SuppressionModal
        nom={deleting?.nomVille ?? null}
        titre="Supprimer cette ville ?"
        precision="Une ville qui contient des secteurs, ou qui est utilisée par des annonces, demandes ou offres, ne peut pas être supprimée."
        loading={remove.isPending}
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
