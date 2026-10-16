import { libelleVille } from "@/utils/ville";
import { useVilleFiltre } from "@/hooks/useVilleFiltre";
import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Building2, CheckCircle2, Eye, Mail, MapPin, Package, Phone, UserPlus, XCircle } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, SearchInput, Select, StatutBadge } from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useOffresQuery, useUpdateStatutOffreMutation } from "@/hooks/queries/useOffres";
import { useCreateUserAdminMutation } from "@/hooks/queries/useUsersAdmin";
import { creerCompteProprietaireSchema, type CreerCompteProprietaireFormInput, type CreerCompteProprietaireFormValues } from "../schemas";
import { statutLabel } from "@/utils/statut";
import { formatDateTime } from "@/utils/format";
import { passwordStrengthMessage } from "@/utils/validation";
import { offresApi } from "@/api/offres";
import { ApiError } from "@/api/http";
import { MediaGallery } from "@/components/ui/MediaGallery";
import { useAgenceMediasQuery } from "@/hooks/queries/useMedias";
import { toMediaItems } from "@/utils/media";
import type { OffreResponse, StatutOffre } from "@/api/types";

const STATUTS: StatutOffre[] = ["EN_ATTENTE", "TRAITEE", "REFUSEE"];

function splitNomComplet(nomComplet: string): { prenom: string; nom: string } {
  const parts = nomComplet.trim().split(/\s+/);
  return { prenom: parts[0] ?? "", nom: parts.slice(1).join(" ") || parts[0] || "" };
}

function OffreDetail({ offre, children }: { offre: OffreResponse; children: ReactNode }) {
  const { data } = useAgenceMediasQuery("OFFRE", offre.idOffre);
  const items = toMediaItems(data ?? []);
  const hasMedia = items.length > 0;
  return (
    <div className={hasMedia ? "grid gap-5 md:grid-cols-2 md:items-start" : ""}>
      {hasMedia && <MediaGallery items={items} alt={offre.titre ?? offre.nomComplet} />}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function AgentOffresPage() {
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<StatutOffre | "">("");
  const [viewing, setViewing] = useState<OffreResponse | null>(null);
  const [creatingAccountFor, setCreatingAccountFor] = useState<OffreResponse | null>(null);

  const villeFiltre = useVilleFiltre();
  const offresQuery = useOffresQuery({ ...villeFiltre, page, size: 20, sort: "dateOffre,desc", statut: statutFilter || undefined, recherche: recherche || undefined });
  const compteurs = useCompteursStatut(useOffresQuery, { ...villeFiltre, recherche: recherche || undefined }, ["EN_ATTENTE", "TRAITEE", "REFUSEE"] as const);
  const statutMutation = useUpdateStatutOffreMutation();
  const createAccountMutation = useCreateUserAdminMutation();

  const createAccountForm = useForm<CreerCompteProprietaireFormInput, unknown, CreerCompteProprietaireFormValues>({
    resolver: zodResolver(creerCompteProprietaireSchema),
  });
  const newAccountPassword = createAccountForm.watch("password");

  function openCreateAccount(o: OffreResponse) {
    const { prenom, nom } = splitNomComplet(o.nomComplet);
    createAccountForm.reset({ prenom, nom, email: o.email ?? "", telephone: o.telephone ?? "", password: "" });
    setCreatingAccountFor(o);
  }

  async function onCreateAccount(values: CreerCompteProprietaireFormValues) {
    try {
      await createAccountMutation.mutateAsync({ ...values, role: "ROLE_BAILLEUR" });
      toast.success("Compte propriétaire créé. Vous pouvez maintenant créer la cour.");
      setCreatingAccountFor(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Création du compte impossible.");
    }
  }

  // Filtre statut, recherche et pagination sont appliqués côté serveur
  const offres = offresQuery.data?.content ?? [];
  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: offres,
    getId: (o) => o.idOffre,
    fetchOne: offresApi.getOffre,
    queryKey: ["offres"],
  });

  async function handleChangeStatutRow(o: OffreResponse, statut: StatutOffre) {
    try {
      await statutMutation.mutateAsync({ id: o.idOffre, body: { statut } });
      setViewing((v) => (v && v.idOffre === o.idOffre ? { ...v, statut } : v));
      toast.success(statut === "TRAITEE" ? "Offre marquée comme traitée." : statut === "REFUSEE" ? "Offre refusée." : "Statut remis en attente.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Changement de statut impossible.");
    }
  }

  const columns: DataTableColumn<OffreResponse>[] = [
    { key: "nom", header: "Nom", render: (o) => o.nomComplet },
    { key: "titre", header: "Titre", render: (o) => o.titre ?? "-" },
    { key: "type", header: "Type", render: (o) => o.typeOffre ?? "-" },
    { key: "ville", header: "Ville", render: (o) => libelleVille(o) },
    { key: "adresse", header: "Adresse", render: (o) => o.adresse ?? "-" },
    { key: "date", header: "Reçue le", render: (o) => formatDateTime(o.dateOffre) },
    { key: "statut", header: "Statut", render: (o) => <StatutBadge statut={o.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (o) => {
        const items: ActionGroupItem[] = [
          { label: "Voir l'offre", text: "Voir", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setViewing(o) },
        ];
        if (o.statut === "EN_ATTENTE") {
          items.push(
            {
              label: "Marquer comme traitée",
              text: "Traitée",
              icon: <CheckCircle2 size={15} aria-hidden="true" />,
              onClick: () => handleChangeStatutRow(o, "TRAITEE"),
            },
            {
              label: "Refuser l'offre",
              text: "Refuser",
              icon: <XCircle size={15} aria-hidden="true" />,
              onClick: () => handleChangeStatutRow(o, "REFUSEE"),
            },
          );
        }
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader tone="indigo" title="Offres" description="Les offres de biens proposées par le public à l'agence." />

      <CompteursStatut compteurs={compteurs} statuts={["EN_ATTENTE", "TRAITEE", "REFUSEE"] as const} />

      {offresQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les offres"
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
                  setStatutFilter(e.target.value as StatutOffre | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un nom, un titre, une adresse…" ariaLabel="Rechercher parmi les offres" />
            </div>
          </div>
          <DataTable
            data={lignes}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(o) => o.idOffre}
            loading={offresQuery.isLoading}
            emptyMessage={search || statutFilter ? "Aucune offre ne correspond à votre recherche" : "Aucune offre reçue pour le moment"}
          />
          {offresQuery.data && (
            <Pagination
              currentPage={offresQuery.data.page.number}
              totalPages={offresQuery.data.page.totalPages}
              totalElements={offresQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Offre - ${viewing.nomComplet}` : "Offre"} titleTone="indigo" size="xl">
        {viewing && (
          <OffreDetail offre={viewing}>
            <div className="text-sm text-slate-600">
              {viewing.email && (
                <p className="flex items-center gap-1.5">
                  <Mail size={14} className="text-primary-600" aria-hidden="true" />
                  {viewing.email}
                </p>
              )}
              {viewing.telephone && (
                <p className="mt-1 flex items-center gap-1.5">
                  <Phone size={14} className="text-primary-600" aria-hidden="true" />
                  {viewing.telephone}
                </p>
              )}
              {viewing.adresse && (
                <p className="mt-1 flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary-600" aria-hidden="true" />
                  {viewing.adresse}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(viewing.dateOffre)}</p>
            </div>
            {viewing.titre && <p className="font-medium text-slate-900">{viewing.titre}</p>}
            {viewing.description && <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{viewing.description}</p>}

            {viewing.statut === "EN_ATTENTE" && (
              <div className="rounded-xl border border-accent-100 bg-accent-50 p-3 text-sm text-accent-800">
                <p>Vérifiez l'offre auprès du proposant, puis créez son compte si besoin et la cour ou le bien/service correspondant.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openCreateAccount(viewing)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-800 hover:underline"
                  >
                    <UserPlus size={14} aria-hidden="true" />
                    Créer le compte propriétaire
                  </button>
                  <Link to="/espace-agent/cours" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-800 hover:underline">
                    <Building2 size={14} aria-hidden="true" />
                    Créer une cour
                  </Link>
                  <Link
                    to="/espace-agent/biens-services"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-800 hover:underline"
                  >
                    <Package size={14} aria-hidden="true" />
                    Créer un bien/service
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Statut :</span>
              <div className="flex flex-wrap justify-end gap-2">
                {STATUTS.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={viewing.statut === s ? "primary" : "secondary"}
                    disabled={viewing.statut === s || statutMutation.isPending}
                    onClick={() => handleChangeStatutRow(viewing, s)}
                  >
                    {statutLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          </OffreDetail>
        )}
      </Modal>

      <Modal isOpen={creatingAccountFor !== null} onClose={() => setCreatingAccountFor(null)} title="Créer le compte propriétaire" titleTone="indigo">
        {creatingAccountFor && (
          <form className="space-y-4" onSubmit={createAccountForm.handleSubmit(onCreateAccount)} noValidate>
            <p className="text-sm text-slate-600">
              Compte bailleur pour <strong>{creatingAccountFor.nomComplet}</strong>, à vérifier et corriger si besoin avant de
              valider.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Prénom" required error={createAccountForm.formState.errors.prenom?.message} {...createAccountForm.register("prenom")} />
              <Input label="Nom" required error={createAccountForm.formState.errors.nom?.message} {...createAccountForm.register("nom")} />
            </div>
            <Input label="Email" type="email" required error={createAccountForm.formState.errors.email?.message} {...createAccountForm.register("email")} />
            <Input label="Téléphone" required error={createAccountForm.formState.errors.telephone?.message} {...createAccountForm.register("telephone")} />
            <Input
              label="Mot de passe provisoire"
              type="password"
              required
              helperText={
                newAccountPassword ? passwordStrengthMessage(newAccountPassword) : "À communiquer au propriétaire ; il pourra le changer ensuite."
              }
              error={createAccountForm.formState.errors.password?.message}
              {...createAccountForm.register("password")}
            />
            <Button type="submit" fullWidth loading={createAccountMutation.isPending}>
              Créer le compte
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
