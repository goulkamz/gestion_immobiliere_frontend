import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, LoadingSpinner, PageHeader, PageLayout, Pagination } from "@/components/ui";
import { MediaPropertyCard } from "../components/MediaPropertyCard";
import { useAnnoncesQuery } from "@/hooks/queries/usePublicCatalog";
import { getAnnonceImage } from "@/utils/media";
import { formatDate, formatMontant } from "@/utils/format";
import { buildAnnonceContactState } from "@/utils/annonceContact";

const PAGE_SIZE = 9;

export function AnnoncesPage() {
  const [page, setPage] = useState(0);
  const annoncesQuery = useAnnoncesQuery({ page, size: PAGE_SIZE, statut: "ACTIVE" });
  const navigate = useNavigate();

  return (
    <PageLayout>
      <PageHeader title="Annonces" description="Les annonces actives publiées par l'agence." />

      {annoncesQuery.isLoading && <LoadingSpinner text="Chargement des annonces…" />}

      {annoncesQuery.data && annoncesQuery.data.content.length === 0 && (
        <EmptyState title="Aucune annonce active pour le moment" />
      )}

      {annoncesQuery.data && annoncesQuery.data.content.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {annoncesQuery.data.content.map((annonce) => (
              <MediaPropertyCard
                key={annonce.idAnnonce}
                entiteType="ANNONCE"
                entiteId={annonce.idAnnonce}
                fallbackImageUrl={getAnnonceImage(annonce.idAnnonce)}
                title={annonce.titre}
                description={annonce.description ?? annonce.localisation ?? "Annonce de l'agence"}
                priceLabel={
                  annonce.prix !== null ? formatMontant(annonce.prix) : `Publié le ${formatDate(annonce.datePublication)}`
                }
                detailHref={`/annonces/${annonce.idAnnonce}`}
                actionKind="contacter"
                onReserve={() => navigate("/contact", { state: buildAnnonceContactState(annonce.titre) })}
              />
            ))}
          </div>
          <Pagination
            currentPage={annoncesQuery.data.page.number}
            totalPages={annoncesQuery.data.page.totalPages}
            totalElements={annoncesQuery.data.page.totalElements}
            onPageChange={setPage}
          />
        </>
      )}
    </PageLayout>
  );
}
