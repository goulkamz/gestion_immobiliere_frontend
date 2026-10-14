import { useState } from "react";
import { AlertTriangle, Building2, DoorOpen, Eye, MapPin } from "lucide-react";
import {
  ActionGroup,
  CompteursStatut,
  CourDetailModal,
  DataTable,
  EmptyState,
  MaisonDetailModalFromData,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatutBadge,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useMaisonsGestionQuery } from "@/hooks/queries/useMaisons";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { statutLabel } from "@/utils/statut";
import { formatMontant } from "@/utils/format";
import type { CourResponse, MaisonResponse, StatutMaison } from "@/api/types";

const STATUTS = ["DISPONIBLE", "RESERVEE", "LOUEE", "EN_MAINTENANCE"] as const;

export function BailleurPatrimoinePage() {
  const {
    search,
    setSearch,
    recherche,
    page: pageCours,
    setPage: setPageCours,
  } = useRechercheServeur();
  const [pageMaisons, setPageMaisons] = useState(0);
  const [statutFilter, setStatutFilter] = useState<StatutMaison | "">("");
  const [detailCour, setDetailCour] = useState<CourResponse | null>(null);
  const [detailMaison, setDetailMaison] = useState<MaisonResponse | null>(null);

  // Périmètre (mon patrimoine), recherche, statut et pagination sont appliqués côté serveur
  const coursQuery = useCoursQuery({
    page: pageCours,
    size: 20,
    recherche: recherche || undefined,
  });
  const maisonsQuery = useMaisonsGestionQuery({
    page: pageMaisons,
    size: 20,
    recherche: recherche || undefined,
    statut: statutFilter || undefined,
  });
  const compteurs = useCompteursStatut(
    useMaisonsGestionQuery,
    { recherche: recherche || undefined },
    STATUTS,
  );
  const cours = coursQuery.data?.content ?? [];
  const maisons = maisonsQuery.data?.content ?? [];
  const term = recherche;

  const courColumns: DataTableColumn<CourResponse>[] = [
    {
      key: "reference",
      header: "Cour",
      render: (c) => (
        <span className="flex items-center gap-2">
          <Building2
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {c.referenceCour}
        </span>
      ),
    },
    { key: "lot", header: "Lot", render: (c) => c.lotCour ?? "-" },
    {
      key: "secteur",
      header: "Secteur",
      render: (c) => (
        <span className="flex items-center gap-2">
          <MapPin
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {c.nomSecteur}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (x) => {
        const items: ActionGroupItem[] = [
          {
            label: "Voir le détail",
            text: "Détails",
            icon: <Eye size={15} aria-hidden="true" />,
            onClick: () => setDetailCour(x),
          },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  const maisonColumns: DataTableColumn<MaisonResponse>[] = [
    {
      key: "nom",
      header: "Maison",
      render: (m) => (
        <span className="flex items-center gap-2">
          <DoorOpen
            size={15}
            className="shrink-0 text-primary-600"
            aria-hidden="true"
          />
          {m.nomCommunMaison ?? `Maison #${m.idMaison}`}
        </span>
      ),
    },
    { key: "cour", header: "Cour", render: (m) => m.referenceCour },
    { key: "type", header: "Type", render: (m) => m.typeMaison ?? "-" },
    {
      key: "pieces",
      header: "Pièces",
      align: "right",
      render: (m) => m.nombrePiece ?? "-",
    },
    {
      key: "loyer",
      header: "Loyer",
      align: "right",
      render: (m) => formatMontant(m.loyer),
    },
    {
      key: "statut",
      header: "Statut",
      render: (m) => <StatutBadge statut={m.statut} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (x) => {
        const items: ActionGroupItem[] = [
          {
            label: "Voir le détail",
            text: "Détails",
            icon: <Eye size={15} aria-hidden="true" />,
            onClick: () => setDetailMaison(x),
          },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <CourDetailModal cour={detailCour} onClose={() => setDetailCour(null)} />
      <MaisonDetailModalFromData
        maison={detailMaison}
        onClose={() => setDetailMaison(null)}
      />
      <PageHeader
        tone="indigo"
        title="Mon patrimoine"
        description="Vos cours et les maisons qui les composent."
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS} />
      {coursQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger votre patrimoine"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="max-w-sm flex-1">
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPageMaisons(0);
                }}
                placeholder="Rechercher une cour ou une maison…"
                ariaLabel="Rechercher dans mon patrimoine"
              />
            </div>
            <div className="sm:w-44">
              <Select
                aria-label="Filtrer les maisons par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutMaison | "");
                  setPageMaisons(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((st) => ({
                  value: st,
                  label: statutLabel(st),
                }))}
              />
            </div>
          </div>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-slate-900">
              Mes cours
            </h2>
            <DataTable
              data={cours}
              columns={courColumns}
              keyExtractor={(c) => c.idCour}
              loading={coursQuery.isLoading}
              emptyMessage={
                term
                  ? "Aucune cour ne correspond à votre recherche"
                  : "Aucune cour enregistrée à votre nom pour le moment"
              }
            />
            {coursQuery.data && (
              <Pagination
                currentPage={coursQuery.data.page.number}
                totalPages={coursQuery.data.page.totalPages}
                totalElements={coursQuery.data.page.totalElements}
                onPageChange={setPageCours}
              />
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-slate-900">
              Mes maisons
            </h2>
            <DataTable
              data={maisons}
              columns={maisonColumns}
              keyExtractor={(m) => m.idMaison}
              loading={maisonsQuery.isLoading}
              emptyMessage={
                term
                  ? "Aucune maison ne correspond à votre recherche"
                  : "Aucune maison dans votre patrimoine pour le moment"
              }
            />
            {maisonsQuery.data && (
              <Pagination
                currentPage={maisonsQuery.data.page.number}
                totalPages={maisonsQuery.data.page.totalPages}
                totalElements={maisonsQuery.data.page.totalElements}
                onPageChange={setPageMaisons}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
