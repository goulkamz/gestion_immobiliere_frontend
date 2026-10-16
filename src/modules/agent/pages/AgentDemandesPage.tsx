import { libelleVille } from "@/utils/ville";
import { useVilleFiltre } from "@/hooks/useVilleFiltre";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { CompteursStatut } from "@/components/ui";
import { useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Eye, Mail, Phone } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Modal, PageHeader, Pagination, SearchInput, Select, StatutBadge } from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useDemandesQuery, useUpdateStatutDemandeMutation } from "@/hooks/queries/useDemandes";
import { statutLabel } from "@/utils/statut";
import { formatDateTime, formatMontant } from "@/utils/format";
import { ApiError } from "@/api/http";
import { demandesApi } from "@/api/demandes";
import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import type { DemandeResponse, StatutDemande } from "@/api/types";

const STATUTS: StatutDemande[] = ["EN_ATTENTE", "EN_COURS", "SATISFAITE", "ANNULEE"];

export function AgentDemandesPage() {
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<StatutDemande | "">("");
  const [viewing, setViewing] = useState<DemandeResponse | null>(null);

  const villeFiltre = useVilleFiltre();
  const demandesQuery = useDemandesQuery({ ...villeFiltre, page, size: 20, sort: "dateDemande,desc", statut: statutFilter || undefined, recherche: recherche || undefined });
  const compteurs = useCompteursStatut(useDemandesQuery, { ...villeFiltre, recherche: recherche || undefined }, ["EN_ATTENTE", "EN_COURS", "SATISFAITE", "ANNULEE"] as const);
  const statutMutation = useUpdateStatutDemandeMutation();

  // Filtre statut, recherche et pagination sont appliqués côté serveur
  const demandes = demandesQuery.data?.content ?? [];
  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: demandes,
    getId: (d) => d.idDemande,
    fetchOne: demandesApi.getDemande,
    queryKey: ["demandes"],
  });

  async function handleChangeStatut(statut: StatutDemande) {
    if (!viewing) return;
    try {
      await statutMutation.mutateAsync({ id: viewing.idDemande, body: { statut } });
      setViewing((v) => (v ? { ...v, statut } : v));
      toast.success("Statut mis à jour.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Changement de statut impossible.");
    }
  }

  const columns: DataTableColumn<DemandeResponse>[] = [
    { key: "nom", header: "Nom", render: (d) => d.nomComplet },
    { key: "typeBien", header: "Type recherché", render: (d) => d.typeBien ?? "-" },
    { key: "ville", header: "Ville", render: (d) => libelleVille(d) },
    { key: "localisation", header: "Localisation souhaitée", render: (d) => d.localisationSouhaite ?? "-" },
    { key: "budget", header: "Budget max", align: "right", render: (d) => formatMontant(d.budgetMax) },
    { key: "date", header: "Reçue le", render: (d) => formatDateTime(d.dateDemande) },
    { key: "statut", header: "Statut", render: (d) => <StatutBadge statut={d.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => {
        const items: ActionGroupItem[] = [
          { label: "Voir la demande", text: "Voir", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setViewing(d) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader tone="indigo" title="Demandes" description="Les besoins exprimés par les clients via le formulaire de demande." />

      <CompteursStatut compteurs={compteurs} statuts={["EN_ATTENTE", "EN_COURS", "SATISFAITE", "ANNULEE"] as const} />

      {demandesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les demandes"
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
                  setStatutFilter(e.target.value as StatutDemande | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un nom, un type de bien, un lieu…" ariaLabel="Rechercher parmi les demandes" />
            </div>
          </div>
          <DataTable
            data={lignes}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(d) => d.idDemande}
            loading={demandesQuery.isLoading}
            emptyMessage={search || statutFilter ? "Aucune demande ne correspond à votre recherche" : "Aucune demande reçue pour le moment"}
          />
          {demandesQuery.data && (
            <Pagination
              currentPage={demandesQuery.data.page.number}
              totalPages={demandesQuery.data.page.totalPages}
              totalElements={demandesQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Demande - ${viewing.nomComplet}` : "Demande"} titleTone="indigo">
        {viewing && (
          <div className="space-y-4">
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
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(viewing.dateDemande)}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Type de bien</dt>
              <dd className="text-right text-slate-900">{viewing.typeBien ?? "-"}</dd>
              <dt className="text-slate-500">Ville</dt>
              <dd className="text-right text-slate-900">{libelleVille(viewing)}</dd>
              <dt className="text-slate-500">Localisation souhaitée</dt>
              <dd className="text-right text-slate-900">{viewing.localisationSouhaite ?? "-"}</dd>
              <dt className="text-slate-500">Budget maximum</dt>
              <dd className="text-right text-slate-900">{formatMontant(viewing.budgetMax)}</dd>
            </dl>
            {viewing.description && <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{viewing.description}</p>}
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Statut :</span>
              <div className="flex flex-wrap justify-end gap-2">
                {STATUTS.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={viewing.statut === s ? "primary" : "secondary"}
                    disabled={viewing.statut === s || statutMutation.isPending}
                    onClick={() => handleChangeStatut(s)}
                  >
                    {statutLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
