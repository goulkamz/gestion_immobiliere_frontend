import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, CheckCircle2, Eye, Plus, Star, XCircle } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, Select, StatutBadge, Textarea } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useAdminTemoignagesQuery, useCreateAdminTemoignageMutation, useUpdateStatutTemoignageMutation } from "@/hooks/queries/useTemoignagesAdmin";
import { temoignageAdminCreateSchema, type TemoignageAdminCreateFormInput, type TemoignageAdminCreateFormValues } from "../schemas";
import { useSessionStore, selectRole } from "@/store/sessionStore";
import { statutLabel } from "@/utils/statut";
import { temoignageRoleLabel } from "@/utils/temoignage";
import { formatDate } from "@/utils/format";
import { ApiError } from "@/api/http";
import type { TemoignageAdminResponse, TemoignageRole, TemoignageStatut } from "@/api/types";

const STATUTS: TemoignageStatut[] = ["EN_ATTENTE", "PUBLIE", "RETIRE"];
const ROLES: TemoignageRole[] = ["PROPRIETAIRE", "LOCATAIRE", "AGENCE", "AUTRE"];

export function AgentTemoignagesPage() {
  const role = useSessionStore(selectRole);
  const isAdmin = role === "ROLE_ADMIN";

  const [statutFilter, setStatutFilter] = useState<TemoignageStatut | "">("EN_ATTENTE");
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState<TemoignageAdminResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const temoignagesQuery = useAdminTemoignagesQuery({ page, size: 20, statut: statutFilter || undefined });
  const statutMutation = useUpdateStatutTemoignageMutation();
  const createMutation = useCreateAdminTemoignageMutation();

  const createForm = useForm<TemoignageAdminCreateFormInput, unknown, TemoignageAdminCreateFormValues>({
    resolver: zodResolver(temoignageAdminCreateSchema),
  });

  const temoignages = useMemo(() => temoignagesQuery.data?.content ?? [], [temoignagesQuery.data]);

  async function handleChangeStatut(t: TemoignageAdminResponse, statut: TemoignageStatut) {
    try {
      await statutMutation.mutateAsync({ id: t.idTemoignage, body: { statut } });
      toast.success(statut === "PUBLIE" ? "Témoignage publié." : "Témoignage retiré.");
      setViewing((v) => (v && v.idTemoignage === t.idTemoignage ? { ...v, statut } : v));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Changement de statut impossible.");
    }
  }

  async function onCreate(values: TemoignageAdminCreateFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Témoignage créé et publié.");
      createForm.reset({});
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Création impossible.");
    }
  }

  const columns: DataTableColumn<TemoignageAdminResponse>[] = [
    { key: "auteur", header: "Auteur", render: (t) => t.nomAuteur },
    { key: "role", header: "Rôle", render: (t) => temoignageRoleLabel(t.role) },
    { key: "texte", header: "Texte", render: (t) => <span className="line-clamp-2 max-w-sm">{t.texte}</span> },
    {
      key: "note",
      header: "Note",
      render: (t) =>
        t.note ? (
          <span className="flex items-center gap-1">
            <Star size={13} className="fill-accent-400 text-accent-400" aria-hidden="true" />
            {t.note}/5
          </span>
        ) : (
          "-"
        ),
    },
    { key: "date", header: "Date", render: (t) => formatDate(t.date) },
    { key: "statut", header: "Statut", render: (t) => <StatutBadge statut={t.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => {
        const items: ActionGroupItem[] = [
          { label: "Voir le témoignage", text: "Voir", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setViewing(t) },
        ];
        if (isAdmin && t.statut !== "PUBLIE") {
          items.push({
            label: "Publier",
            text: "Publier",
            icon: <CheckCircle2 size={15} aria-hidden="true" />,
            onClick: () => handleChangeStatut(t, "PUBLIE"),
          });
        }
        if (isAdmin && t.statut !== "RETIRE") {
          items.push({
            label: "Retirer",
            text: "Retirer",
            icon: <XCircle size={15} aria-hidden="true" />,
            onClick: () => handleChangeStatut(t, "RETIRE"),
          });
        }
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Témoignages"
        description={
          isAdmin
            ? "Modérez les témoignages déposés par le public avant leur publication sur la page d'accueil."
            : "Consultez la file de témoignages déposés par le public. Seul un administrateur peut publier ou retirer un témoignage."
        }
        actions={
          <Button
            variant="accent"
            icon={<Plus size={16} />}
            onClick={() => {
              createForm.reset({});
              setCreateOpen(true);
            }}
          >
            Nouveau témoignage
          </Button>
        }
      />

      {temoignagesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les témoignages"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <div className="sm:w-48">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as TemoignageStatut | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
          </div>
          <DataTable
            data={temoignages}
            columns={columns}
            keyExtractor={(t) => t.idTemoignage}
            loading={temoignagesQuery.isLoading}
            emptyMessage={statutFilter ? "Aucun témoignage avec ce statut" : "Aucun témoignage pour le moment"}
          />
          {temoignagesQuery.data && (
            <Pagination
              currentPage={temoignagesQuery.data.page.number}
              totalPages={temoignagesQuery.data.page.totalPages}
              totalElements={temoignagesQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Témoignage - ${viewing.nomAuteur}` : "Témoignage"} titleTone="indigo">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {temoignageRoleLabel(viewing.role)} - {formatDate(viewing.date)}
              </span>
              <StatutBadge statut={viewing.statut} />
            </div>
            {viewing.note && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={15} className={i < viewing.note! ? "fill-accent-400 text-accent-400" : "text-slate-200"} aria-hidden="true" />
                ))}
              </div>
            )}
            <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{viewing.texte}</p>
            {isAdmin && (
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <Button
                  variant={viewing.statut === "PUBLIE" ? "secondary" : "success"}
                  disabled={viewing.statut === "PUBLIE" || statutMutation.isPending}
                  className="flex-1"
                  onClick={() => handleChangeStatut(viewing, "PUBLIE")}
                >
                  Publier
                </Button>
                <Button
                  variant={viewing.statut === "RETIRE" ? "secondary" : "danger"}
                  disabled={viewing.statut === "RETIRE" || statutMutation.isPending}
                  className="flex-1"
                  onClick={() => handleChangeStatut(viewing, "RETIRE")}
                >
                  Retirer
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau témoignage" titleTone="indigo">
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
          <Input label="Nom de l'auteur" required error={createForm.formState.errors.nomAuteur?.message} {...createForm.register("nomAuteur")} />
          <Select
            label="Rôle"
            required
            placeholder="Choisissez un rôle"
            error={createForm.formState.errors.role?.message}
            options={ROLES.map((r) => ({ value: r, label: temoignageRoleLabel(r) }))}
            {...createForm.register("role")}
          />
          <Textarea label="Texte" required error={createForm.formState.errors.texte?.message} {...createForm.register("texte")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Note (optionnelle)"
              placeholder="Pas de note"
              error={createForm.formState.errors.note?.message}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} / 5` }))}
              {...createForm.register("note")}
            />
            <Input label="Date" type="date" error={createForm.formState.errors.date?.message} {...createForm.register("date")} />
          </div>
          <p className="text-xs text-slate-500">Ce témoignage sera publié immédiatement sur la page d'accueil.</p>
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Créer et publier
          </Button>
        </form>
      </Modal>
    </div>
  );
}
