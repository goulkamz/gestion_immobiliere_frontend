import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Edit2, MapPin, Plus, Trash2 } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, Pagination, SearchInput, Select } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { ApiError } from "@/api/http";
import type { SecteurResponse } from "@/api/types";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { useSecteursAdminQuery, useSecteursMutations, useVillesAdminQuery } from "@/hooks/queries/useLocalisationAdmin";
import { secteurSchema, type SecteurFormInput, type SecteurFormValues } from "./schemas";
import { SuppressionModal } from "./SuppressionModal";

export function SecteursSection() {
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [idVilleFiltre, setIdVilleFiltre] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SecteurResponse | null>(null);
  const [deleting, setDeleting] = useState<SecteurResponse | null>(null);

  const villesQuery = useVillesAdminQuery();
  const secteursQuery = useSecteursAdminQuery({
    page,
    size: 20,
    recherche: recherche || undefined,
    idVille: idVilleFiltre ? Number(idVilleFiltre) : undefined,
  });
  const { create, update, remove } = useSecteursMutations();
  const form = useForm<SecteurFormInput, unknown, SecteurFormValues>({ resolver: zodResolver(secteurSchema) });

  const optionsVilles = (villesQuery.data?.content ?? []).map((v) => ({ value: v.idVille, label: `${v.nomVille} (${v.nomPays})` }));
  const secteurs = secteursQuery.data?.content ?? [];

  function openCreate() {
    setEditing(null);
    form.reset({ idVille: idVilleFiltre, codeSecteur: "", nomSecteur: "" });
    setFormOpen(true);
  }

  function openEdit(s: SecteurResponse) {
    setEditing(s);
    form.reset({ idVille: s.idVille, codeSecteur: s.codeSecteur, nomSecteur: s.nomSecteur });
    setFormOpen(true);
  }

  async function onSubmit(values: SecteurFormValues) {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.idSecteur, body: values });
        toast.success("Secteur mis à jour.");
      } else {
        await create.mutateAsync(values);
        toast.success("Secteur créé.");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  async function onDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.idSecteur);
      toast.success("Secteur supprimé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible.");
    }
    setDeleting(null);
  }

  const columns: DataTableColumn<SecteurResponse>[] = [
    {
      key: "nomSecteur",
      header: "Secteur",
      render: (s) => (
        <span className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {s.nomSecteur}
        </span>
      ),
    },
    { key: "codeSecteur", header: "Code", render: (s) => s.codeSecteur },
    { key: "nomVille", header: "Ville", render: (s) => s.nomVille },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) => {
        const items: ActionGroupItem[] = [
          { label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(s) },
          { label: "Supprimer", text: "Supprimer", icon: <Trash2 size={15} aria-hidden="true" />, tone: "danger", onClick: () => setDeleting(s) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  if (secteursQuery.isError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} />}
        title="Impossible de charger les secteurs"
        description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-xl flex-wrap gap-3">
          <div className="w-full max-w-xs">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un secteur…" ariaLabel="Rechercher parmi les secteurs" />
          </div>
          <div className="w-full max-w-[16rem]">
            <Select
              aria-label="Filtrer par ville"
              options={optionsVilles}
              placeholder="Toutes les villes"
              value={idVilleFiltre}
              onChange={(e) => {
                setIdVilleFiltre(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>
        <Button variant="accent" icon={<Plus size={16} />} onClick={openCreate}>
          Nouveau secteur
        </Button>
      </div>
      <DataTable
        data={secteurs}
        columns={columns}
        keyExtractor={(s) => s.idSecteur}
        loading={secteursQuery.isLoading}
        emptyMessage={search || idVilleFiltre ? "Aucun secteur ne correspond à votre recherche" : "Aucun secteur enregistré pour le moment"}
      />
      {secteursQuery.data && (
        <Pagination
          currentPage={secteursQuery.data.page.number}
          totalPages={secteursQuery.data.page.totalPages}
          totalElements={secteursQuery.data.page.totalElements}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Modifier - ${editing.nomSecteur}` : "Nouveau secteur"} titleTone="indigo">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Select label="Ville" required options={optionsVilles} placeholder="Choisir une ville" error={form.formState.errors.idVille?.message} {...form.register("idVille")} />
          <Input label="Nom du secteur" required error={form.formState.errors.nomSecteur?.message} {...form.register("nomSecteur")} />
          <Input label="Code" required error={form.formState.errors.codeSecteur?.message} {...form.register("codeSecteur")} />
          <Button type="submit" fullWidth loading={create.isPending || update.isPending}>
            {editing ? "Enregistrer" : "Créer le secteur"}
          </Button>
        </form>
      </Modal>

      <SuppressionModal
        nom={deleting?.nomSecteur ?? null}
        titre="Supprimer ce secteur ?"
        precision="Un secteur qui contient des cours, des biens ou des services ne peut pas être supprimé."
        loading={remove.isPending}
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
