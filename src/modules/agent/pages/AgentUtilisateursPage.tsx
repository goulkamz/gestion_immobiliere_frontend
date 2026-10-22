import { useCible } from "@/hooks/useLigneCiblee";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Ban, CheckCircle2, List, Pencil, Plus, Repeat, RotateCcw, Trash2, UserCheck, UserCog, UserX, Users, XCircle } from "lucide-react";
import { ActionGroup, Badge, Button, DataTable, EmptyState, Input, Modal, PageHeader, SearchInput, Select, StatCard } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useCreateUserAdminMutation, useRestaurerUserMutation, useSupprimerUserMutation, useUpdateUserMutation, useUpdateUserRoleMutation, useUpdateUserStatusMutation, useUsersByRoleQuery } from "@/hooks/queries/useUsersAdmin";
import { useSessionStore, selectRole } from "@/store/sessionStore";
import {
  creerUtilisateurSchema,
  modifierUtilisateurSchema,
  type CreerUtilisateurFormInput,
  type CreerUtilisateurFormValues,
  type ModifierUtilisateurFormInput,
  type ModifierUtilisateurFormValues,
} from "../schemas";
import { passwordStrengthMessage } from "@/utils/validation";
import { ApiError } from "@/api/http";
import type { UserAdminResponse } from "@/api/types";

type RoleOnglet = "ROLE_BAILLEUR" | "ROLE_CLIENT" | "ROLE_AGENT";

const ROLE_LABEL: Record<RoleOnglet, string> = { ROLE_BAILLEUR: "Bailleur", ROLE_CLIENT: "Client", ROLE_AGENT: "Agent" };

export function AgentUtilisateursPage() {
  const isAdmin = useSessionStore(selectRole) === "ROLE_ADMIN";
  const { cibleId, effacer: effacerCible } = useCible();
  // Un compte ciblé par une notification est un nouveau compte client : on ouvre directement cet onglet
  const [onglet, setOnglet] = useState<RoleOnglet | "SUPPRIMES">(cibleId !== null ? "ROLE_CLIENT" : "ROLE_BAILLEUR");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [aSupprimer, setASupprimer] = useState<UserAdminResponse | null>(null);
  const [aModifier, setAModifier] = useState<UserAdminResponse | null>(null);
  const [roleCible, setRoleCible] = useState<UserAdminResponse | null>(null);
  const [nouveauRole, setNouveauRole] = useState<RoleOnglet>("ROLE_CLIENT");

  const supprimes = onglet === "SUPPRIMES";
  const usersQuery = useUsersByRoleQuery(supprimes ? undefined : onglet, supprimes ? { supprimes: true } : undefined);
  const createMutation = useCreateUserAdminMutation();
  const restaurerMutation = useRestaurerUserMutation();
  const supprimerMutation = useSupprimerUserMutation();
  const updateMutation = useUpdateUserMutation();
  const roleMutation = useUpdateUserRoleMutation();
  const statusMutation = useUpdateUserStatusMutation();

  const form = useForm<CreerUtilisateurFormInput, unknown, CreerUtilisateurFormValues>({
    resolver: zodResolver(creerUtilisateurSchema),
  });
  const password = form.watch("password");
  const editForm = useForm<ModifierUtilisateurFormInput, unknown, ModifierUtilisateurFormValues>({
    resolver: zodResolver(modifierUtilisateurSchema),
  });

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

  function openModifier(u: UserAdminResponse) {
    editForm.reset({
      nom: u.nom,
      prenom: u.prenom,
      sexe: (u.sexe ?? "") as "M",
      dateNaissance: u.dateNaissance ?? "",
      telephone: u.telephone ?? "",
      telephone1: u.telephone1 ?? "",
    });
    setAModifier(u);
  }

  async function onModifier(values: ModifierUtilisateurFormValues) {
    if (!aModifier) return;
    try {
      await updateMutation.mutateAsync({ id: aModifier.idUser, body: values });
      toast.success("Le compte a été modifié.");
      setAModifier(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Modification du compte impossible.");
    }
  }

  function openRole(u: UserAdminResponse) {
    setNouveauRole(u.role === "ROLE_CLIENT" ? "ROLE_BAILLEUR" : "ROLE_CLIENT");
    setRoleCible(u);
  }

  async function onChangerRole() {
    if (!roleCible) return;
    try {
      await roleMutation.mutateAsync({ id: roleCible.idUser, role: nouveauRole });
      toast.success(`Le compte de ${roleCible.prenom} ${roleCible.nom} est maintenant ${ROLE_LABEL[nouveauRole].toLowerCase()}. La personne devra se reconnecter.`);
      setOnglet(nouveauRole);
      setRoleCible(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Changement de rôle impossible.");
    }
  }

  async function onSupprimer() {
    if (!aSupprimer) return;
    try {
      await supprimerMutation.mutateAsync(aSupprimer.idUser);
      toast.success(`Le compte de ${aSupprimer.prenom} ${aSupprimer.nom} a été supprimé. Il reste réactivable dans l'onglet Supprimés.`);
      setASupprimer(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression du compte impossible.");
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
                      { label: "Modifier le compte", text: "Modifier", icon: <Pencil size={15} aria-hidden="true" />, onClick: () => openModifier(u) },
                      { label: "Changer le rôle", text: "Rôle", icon: <Repeat size={15} aria-hidden="true" />, onClick: () => openRole(u) },
                      u.flagActif
                        ? { label: "Désactiver le compte", text: "Désactiver", icon: <Ban size={15} aria-hidden="true" />, onClick: () => onToggleActif(u) }
                        : { label: "Activer le compte", text: "Activer", icon: <CheckCircle2 size={15} aria-hidden="true" />, onClick: () => onToggleActif(u) },
                      { label: "Supprimer le compte", text: "Supprimer", icon: <Trash2 size={15} aria-hidden="true" />, tone: "danger", onClick: () => setASupprimer(u) },
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
        description="Les comptes des bailleurs, des clients et des agents, et la création de nouveaux comptes."
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
          <button type="button" onClick={() => setOnglet("ROLE_AGENT")} className={tabClass(onglet === "ROLE_AGENT")}>
            <UserCog size={15} aria-hidden="true" />
            Agents
          </button>
        )}
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

      <Modal isOpen={aModifier !== null} onClose={() => setAModifier(null)} title="Modifier le compte" titleTone="indigo" size="lg">
        <form className="space-y-3" onSubmit={editForm.handleSubmit(onModifier)} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Prénom" required error={editForm.formState.errors.prenom?.message} {...editForm.register("prenom")} />
            <Input label="Nom" required error={editForm.formState.errors.nom?.message} {...editForm.register("nom")} />
            <Select
              label="Sexe"
              required
              placeholder="Sélectionner"
              options={[
                { value: "M", label: "Masculin" },
                { value: "F", label: "Féminin" },
              ]}
              error={editForm.formState.errors.sexe?.message}
              {...editForm.register("sexe")}
            />
            <Input label="Date de naissance" type="date" required error={editForm.formState.errors.dateNaissance?.message} {...editForm.register("dateNaissance")} />
            <Input label="Téléphone" required error={editForm.formState.errors.telephone?.message} {...editForm.register("telephone")} />
            <Input label="Téléphone secondaire" error={editForm.formState.errors.telephone1?.message} {...editForm.register("telephone1")} />
          </div>
          <p className="text-xs text-slate-500">L&apos;adresse e-mail et le mot de passe ne se modifient pas depuis cette fenêtre.</p>
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>

      <Modal isOpen={roleCible !== null} onClose={() => setRoleCible(null)} title="Changer le rôle" titleTone="indigo">
        {roleCible && (
          <>
            <p className="text-sm text-slate-600">
              Compte de <strong>{roleCible.prenom} {roleCible.nom}</strong>, actuellement {ROLE_LABEL[roleCible.role as RoleOnglet]?.toLowerCase() ?? roleCible.role}.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>La personne sera déconnectée et changera d&apos;espace à sa prochaine connexion. Les mandats, contrats et biens déjà liés à ce compte ne sont pas modifiés.</p>
            </div>
            <div className="mt-3">
              <Select
                label="Nouveau rôle"
                value={nouveauRole}
                onChange={(e) => setNouveauRole(e.target.value as RoleOnglet)}
                options={(["ROLE_CLIENT", "ROLE_BAILLEUR", "ROLE_AGENT"] as const)
                  .filter((r) => r !== roleCible.role)
                  .map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRoleCible(null)}>
                Annuler
              </Button>
              <Button className="flex-1" loading={roleMutation.isPending} onClick={onChangerRole}>
                Confirmer
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={aSupprimer !== null} onClose={() => setASupprimer(null)} title="Supprimer ce compte ?" titleTone="indigo">
        {aSupprimer && (
          <>
            <p className="text-sm text-slate-600">
              Vous êtes sur le point de supprimer le compte de <strong>{aSupprimer.prenom} {aSupprimer.nom}</strong>. La personne ne pourra plus se
              connecter, mais son historique est conservé et le compte reste réactivable depuis l&apos;onglet Supprimés.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setASupprimer(null)}>
                Annuler
              </Button>
              <Button variant="danger" className="flex-1" loading={supprimerMutation.isPending} onClick={onSupprimer}>
                Supprimer
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouvel utilisateur" titleTone="indigo" size="lg">
        <form className="space-y-3" onSubmit={form.handleSubmit(onCreate)} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Type de compte"
              required
              options={[
                { value: "ROLE_BAILLEUR", label: "Bailleur" },
                { value: "ROLE_CLIENT", label: "Client" },
                ...(isAdmin ? [{ value: "ROLE_AGENT", label: "Agent" }] : []),
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
