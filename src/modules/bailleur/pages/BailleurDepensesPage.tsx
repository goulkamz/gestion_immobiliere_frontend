import { useState } from "react";
import { AlertTriangle, Building2, Eye } from "lucide-react";
import { CompteursStatut, DataTable, EmptyState, PageHeader, Pagination, Select, StatutBadge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { DepenseDetailModal } from "@/components/ui/DepenseDetailModal";
import { depensesApi } from "@/api/depenses";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useDepensesQuery } from "@/hooks/queries/useDepenses";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import { CATEGORIE_DEPENSE_LABELS, STATUTS_DEPENSE, retenueLabel } from "@/utils/depense";
import { formatDate, formatMontant } from "@/utils/format";
import { statutLabel } from "@/utils/statut";
import type { DepenseResponse, StatutDepense } from "@/api/types";

const STATUTS = STATUTS_DEPENSE;
const LIBELLES_COMPTEURS: Partial<Record<StatutDepense, string>> = {
  EN_COURS: "En cours de retenue",
  A_REGLER: "À régler à l'agence",
  SOLDEE: "Soldées",
  ANNULEE: "Annulées",
};

/** Dépenses à la charge du bailleur sur ses cours, en lecture seule : l'agence les saisit, il en suit les retenues. */
export function BailleurDepensesPage() {
  const [statutFilter, setStatutFilter] = useState<StatutDepense | "">("");
  const [idCourFilter, setIdCourFilter] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Périmètre (mes cours), statut, cour et pagination sont appliqués côté serveur
  const filtres = { idCour: idCourFilter === "" ? undefined : idCourFilter };
  const depensesQuery = useDepensesQuery({ ...filtres, statut: statutFilter || undefined, page, size: 20, sort: "dateDepense,desc" });
  const compteurs = useCompteursStatut(useDepensesQuery, filtres, STATUTS);
  const coursQuery = useCoursQuery({ size: 100 });
  const cours = coursQuery.data?.content ?? [];

  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: depensesQuery.data?.content ?? [],
    getId: (d) => d.idDepense,
    fetchOne: depensesApi.get,
    queryKey: ["depenses"],
  });

  const columns: DataTableColumn<DepenseResponse>[] = [
    { key: "date", header: "Date", render: (d) => formatDate(d.dateDepense) },
    {
      key: "cour",
      header: "Cour",
      render: (d) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          <span>
            {d.referenceCour}
            {d.nomMaison && <span className="block text-xs text-slate-500">{d.nomMaison}</span>}
          </span>
        </span>
      ),
    },
    {
      key: "libelle",
      header: "Dépense",
      render: (d) => (
        <span>
          {d.libelle}
          <span className="block text-xs text-slate-500">{CATEGORIE_DEPENSE_LABELS[d.categorie]}</span>
        </span>
      ),
    },
    { key: "montant", header: "Montant", align: "right", render: (d) => formatMontant(d.montant) },
    { key: "etalement", header: "Retenue", render: (d) => retenueLabel(d) },
    {
      key: "retenu",
      header: "Déjà réglé",
      align: "right",
      render: (d) => (
        <span>
          {formatMontant(d.montantImpute + d.montantRegle)}
          {d.montantRegle > 0 && <span className="block text-xs text-slate-500">dont {formatMontant(d.montantRegle)} en direct</span>}
        </span>
      ),
    },
    { key: "reste", header: "Reste dû", align: "right", render: (d) => formatMontant(d.montantRestant) },
    { key: "statut", header: "Statut", render: (d) => <StatutBadge statut={d.statut} /> },
    {
      key: "actions",
      header: "Détail",
      align: "right",
      render: (d) => (
        <button
          type="button"
          title="Voir le détail et les retenues"
          aria-label={`Voir le détail de la dépense - ${d.libelle}`}
          onClick={() => setDetailId(d.idDepense)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
        >
          <Eye size={16} aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Mes dépenses"
        description="Travaux et frais à votre charge sur vos cours, avancés par l'agence puis retenus sur vos reversements, en une fois ou étalés sur plusieurs mois. Si un reversement ne suffit pas, le reste est reporté sur le suivant. Si le mandat est résilié, le solde est retenu sur vos derniers reversements, puis réglé directement à l'agence."
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} labels={LIBELLES_COMPTEURS} />

      {depensesQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos dépenses"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-48">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutDepense | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
            {cours.length > 1 && (
              <div className="sm:w-48">
                <Select
                  aria-label="Filtrer par cour"
                  value={idCourFilter}
                  onChange={(e) => {
                    setIdCourFilter(e.target.value ? Number(e.target.value) : "");
                    setPage(0);
                  }}
                  placeholder="Toutes les cours"
                  options={cours.map((c) => ({ value: c.idCour, label: c.referenceCour }))}
                />
              </div>
            )}
          </div>
          <DataTable
            data={lignes}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(d) => d.idDepense}
            loading={depensesQuery.isLoading}
            emptyMessage={statutFilter || idCourFilter !== "" ? "Aucune dépense ne correspond à ces filtres" : "Aucune dépense à votre charge pour le moment"}
          />
          {depensesQuery.data && (
            <Pagination
              currentPage={depensesQuery.data.page.number}
              totalPages={depensesQuery.data.page.totalPages}
              totalElements={depensesQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <DepenseDetailModal idDepense={detailId} onClose={() => setDetailId(null)} vue="bailleur" />
    </div>
  );
}
