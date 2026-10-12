import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, Building2, DoorOpen, Eye, MapPin } from "lucide-react";
import {
  ActionGroup,
  CourDetailModal,
  DataTable,
  EmptyState,
  MaisonDetailModalFromData,
  PageHeader,
  SearchInput,
  StatutBadge,
} from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { maisonsQueryKeys } from "@/hooks/queries/useMaisons";
import { maisonsApi } from "@/api/maisons";
import { formatMontant } from "@/utils/format";
import type { CourResponse, MaisonResponse } from "@/api/types";

export function BailleurPatrimoinePage() {
  const [search, setSearch] = useState("");
  const [detailCour, setDetailCour] = useState<CourResponse | null>(null);
  const [detailMaison, setDetailMaison] = useState<MaisonResponse | null>(null);
  const coursQuery = useCoursQuery({ size: 100 });
  const cours = useMemo(
    () => coursQuery.data?.content ?? [],
    [coursQuery.data],
  );

  const maisonsQueries = useQueries({
    queries: cours.map((cour) => ({
      queryKey: maisonsQueryKeys.list({ idCour: cour.idCour, size: 100 }),
      queryFn: () => maisonsApi.list({ idCour: cour.idCour, size: 100 }),
      enabled: cours.length > 0,
    })),
  });

  const maisonsLoading = maisonsQueries.some((q) => q.isLoading);
  const maisons = useMemo(
    () => maisonsQueries.flatMap((q) => q.data?.content ?? []),
    [maisonsQueries],
  );

  const term = search.trim().toLowerCase();
  const coursFiltrees = useMemo(
    () =>
      term
        ? cours.filter((c) =>
            [c.referenceCour, c.lotCour, c.nomSecteur]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term),
          )
        : cours,
    [cours, term],
  );
  const maisonsFiltrees = useMemo(
    () =>
      term
        ? maisons.filter((m) =>
            [m.nomCommunMaison, m.typeMaison, m.referenceCour]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term),
          )
        : maisons,
    [maisons, term],
  );

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
      {coursQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger votre patrimoine"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <div className="space-y-8">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une cour ou une maison…"
              ariaLabel="Rechercher dans mon patrimoine"
            />
          </div>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-slate-900">
              Mes cours
            </h2>
            <DataTable
              data={coursFiltrees}
              columns={courColumns}
              keyExtractor={(c) => c.idCour}
              loading={coursQuery.isLoading}
              emptyMessage={
                term
                  ? "Aucune cour ne correspond à votre recherche"
                  : "Aucune cour enregistrée à votre nom pour le moment"
              }
            />
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-slate-900">
              Mes maisons
            </h2>
            <DataTable
              data={maisonsFiltrees}
              columns={maisonColumns}
              keyExtractor={(m) => m.idMaison}
              loading={coursQuery.isLoading || maisonsLoading}
              emptyMessage={
                term
                  ? "Aucune maison ne correspond à votre recherche"
                  : "Aucune maison dans votre patrimoine pour le moment"
              }
            />
          </section>
        </div>
      )}
    </div>
  );
}
