import { useCible } from "@/hooks/useLigneCiblee";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Ban, CheckCircle2, List, Plus, RotateCcw, UserCheck, UserX, Users, XCircle } from "lucide-react";
import { ActionGroup, Badge, Button, DataTable, EmptyState, Input, Modal, PageHeader, SearchInput, Select, StatCard } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useCreateUserAdminMutation, useRestaurerUserMutation, useUpdateUserStatusMutation, useUsersByRoleQuery } from "@/hooks/queries/useUsersAdmin";
import { useSessionStore, selectRole } from "@/store/sessionStore";
import { creerUtilisateurSchema, type CreerUtilisateurFormInput, type CreerUtilisateurFormValues } from "../schemas";
import { passwordStrengthMessage } from "@/utils/validation";
import { ApiError } from "@/api/http";
import type { UserAdminResponse } from "@/api/types";

type RoleOnglet = "ROLE_BAILLEUR" | "ROLE_CLIENT";

const ROLE_LABEL: Record<RoleOnglet, string> = { ROLE_BAILLEUR: "Bailleur", ROLE_CLIENT: "Client" };

export function AgentUtilisateursPage() {
  const isAdmin = useSessionStore(selectRole) === "ROLE_ADMIN";
  const { cibleId, effacer: effacerCible } = useCible();
  // Un compte ciblé par une notification est un nouveau compte client : on ouvre directement cet onglet
  const [onglet, setOnglet] = useState<RoleOnglet | "SUPPRIMES">(cibleId !== null ? "ROLE_CLIENT" : "ROLE_BAILLEUR");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const supprimes = onglet === "SUPPRIMES";
  const usersQuery = useUsersByRoleQuery(supprimes ? undefined : onglet, supprimes ? { supprimes: true } : undefined);
  const createMutation = useCreateUserAdminMutation();
  const restaurerMutation = useRestaurerUserMutation();
  const statusMutation = useUpdateUserStatusMutation();

  const form = useForm<CreerUtilisateurFormInput, unknown, CreerUtilisateurFormValues>({
    resolver: zodResolver(creerUtilisateurSchema),
  });
  const password = form.watch("password");

  const filtered = useMemo(() => {
    const list = usersQuery.data?.content ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((u) => u.idUser === cibleId || [u.nom, u.prenom, u.email, u.telephone].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [usersQuery.data, search]);

  const tousLesComptes = usersQuery.data?.content ?? [];
  const nbActifs = tousLesComptes.filter((u) => u.flagActif).length;

  function openCreate() {
    form.reset({ role: supprimes ? "ROLE_BAILLEUR" : onglet, nom: "", prenom: "", sexe: "" as "M", dateNaissance: "", email: "", telephone: "", telephone1: "", password: "" });
    setCreateOpen(true);
  }

  async function onCreate(values: CreerUtilisateurFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success(`Compte ${ROLE_LABEL[values.role].toLowerCase()} créé.`);
      setOnglet(values.role);
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Création du compte impossible.");
    }
  }

  async function onRestaurer(u: UserAdminResponse) {
    try {
      await restaurerMutation.mutateAsync(u.idUser);
      toast.success(`Le compte de ${u.prenom} ${u.nom} a été réactivé.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Réactivation du compte impossible.");
    }
  }

  async function onToggleActif(u: UserAdminResponse) {
    try {
      await statusMutation.mutateAsync({ id: u.idUser, flagActif: !u.flagActif });
      toast.success(u.flagActif ? `Le compte de ${u.prenom} ${u.nom} est désactivé.` : `Le compte de ${u.prenom} ${u.nom} est activé.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Modification du statut impossible.");
    }
  }

  const columns: DataTableColumn<UserAdminResponse>[] = [
    { key: "nom", header: "Nom", render: (u) => `${u.prenom} ${u.nom}` },
    { key: "email", header: "Email", render: (u) => u.email },
    { key: "telephone", header: "Téléphone", render: (u) => u.telephone ?? "-" },
    ...(supprimes
      ? [
          { key: "role", header: "Rôle", render: (u: UserAdminResponse) => u.role.replace("ROLE_", "").toLowerCase() },
          {
            key: "actions",
            header: "Actions",
            align: "right" as const,
            render: (u: UserAdminResponse) => {
              const items: ActionGroupItem[] = [
                { label: "Réactiver le compte", text: "Réactiver", icon: <RotateCcw size={15} aria-hidden="true" />, onClick: () => onRestaurer(u) },
              ];
              return <ActionGroup items={items} />;
            },
          },
        ]
      : [
          {
            key: "statut",
            header: "Statut",
            render: (u: UserAdminResponse) => <Badge variant={u.flagActif ? "success" : "neutral"}>{u.flagActif ? "Actif" : "Inactif"}</Badge>,
          },
          ...(isAdmin
            ? [
                {
                  key: "actions",
                  header: "Actions",
                  align: "right" as const,
                  render: (u: UserAdminResponse) => {
                    const items: ActionGroupItem[] = [
                      u.flagActif
                        ? { label: "Désactiver le compte", text: "Désactiver", icon: <Ban size={15} aria-hidden="true" />, onClick: () => onToggleActif(u) }
                        : { label: "Activer le compte", text: "Activer", icon: <CheckCircle2 size={15} aria-hidden="true" />, onClick: () => onToggleActif(u) },
                    ];
                    return <ActionGroup items={items} />;
                  },
                },
              ]
            : []),
        ]),
  ];

  const tabClass = (actif: boolean) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      actif ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Utilisateurs"
        description="Les comptes des bailleurs et des clients, et la création de nouveaux comptes."
        actions={
          <Button variant="accent" icon={<Plus size={16} />} onClick={openCreate}>
            Nouvel utilisateur
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
        <StatCard label="Total" value={usersQuery.data ? tousLesComptes.length : "-"} icon={<List size={20} aria-hidden="true" />} tone="primary" />
        {!supprimes && (
          <>
            <StatCard label="Actifs" value={usersQuery.data ? nbActifs : "-"} icon={<CheckCircle2 size={20} aria-hidden="true" />} tone="success" />
            <StatCard label="Inactifs" value={usersQuery.data ? tousLesComptes.length - nbActifs : "-"} icon={<XCircle size={20} aria-hidden="true" />} tone="danger" />
          </>
        )}
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-primary-100 bg-primary-50/60 p-1">
        <button type="button" onClick={() => setOnglet("ROLE_BAILLEUR")} className={tabClass(onglet === "ROLE_BAILLEUR")}>
          <UserCheck size={15} aria-hidden="true" />
          Bailleurs
        </button>
        <button type="button" onClick={() => setOnglet("ROLE_CLIENT")} className={tabClass(onglet === "ROLE_CLIENT")}>
          <Users size={15} aria-hidden="true" />
          Clients
        </button>
        {isAdmin && (
          <button type="button" onClick={() => setOnglet("SUPPRIMES")} className={tabClass(supprimes)}>
            <UserX size={15} aria-hidden="true" />
            Supprimés
          </button>
        )}
      </div>

      {usersQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les utilisateurs"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur…" ariaLabel="Rechercher parmi les utilisateurs" />
          </div>
          <DataTable
            data={filtered}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(u) => u.idUser}
            loading={usersQuery.isLoading}
            emptyMessage={search ? "Aucun utilisateur ne correspond à votre recherche" : "Aucun compte pour le moment"}
          />
        </>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouvel utilisateur" titleTone="indigo" size="lg">
        <form className="space-y-3" onSubmit={form.handleSubmit(onCreate)} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Type de compte"
              required
              options={[
                { value: "ROLE_BAILLEUR", label: "Bailleur" },
                { value: "ROLE_CLIENT", label: "Client" },
              ]}
              error={form.formState.errors.role?.message}
              {...form.register("role")}
            />
            <Select
              label="Sexe"
              required
              placeholder="Sélectionner"
              options={[
                { value: "M", label: "Masculin" },
                { value: "F", label: "Féminin" },
              ]}
              error={form.formState.errors.sexe?.message}
              {...form.register("sexe")}
            />
            <Input label="Prénom" required error={form.formState.errors.prenom?.message} {...form.register("prenom")} />
            <Input label="Nom" required error={form.formState.errors.nom?.message} {...form.register("nom")} />
            <Input label="Date de naissance" type="date" required error={form.formState.errors.dateNaissance?.message} {...form.register("dateNaissance")} />
            <Input label="Email" type="email" required error={form.formState.errors.email?.message} {...form.register("email")} />
            <Input label="Téléphone" required error={form.formState.errors.telephone?.message} {...form.register("telephone")} />
            <Input label="Téléphone secondaire" error={form.formState.errors.telephone1?.message} {...form.register("telephone1")} />
          </div>
          <Input
            label="Mot de passe provisoire"
            type="password"
            required
            helperText={password ? passwordStrengthMessage(password) : "À communiquer à l'utilisateur ; il pourra le changer ensuite."}
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Créer le compte
          </Button>
        </form>
      </Modal>
    </div>
  );
}
