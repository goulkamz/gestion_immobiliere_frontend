import { useParams, useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Tag } from "lucide-react";
import { ArrowLink, Badge, Button, DetailSectionTitle, EmptyState, MediaGallery, LoadingSpinner, PageLayout } from "@/components/ui";
import { statutToBadgeVariant } from "@/utils/statut";
import { useAnnonceQuery } from "@/hooks/queries/usePublicCatalog";
import { useMediaItems } from "@/hooks/queries/useMedias";
import { getAnnonceGallery } from "@/utils/media";
import { formatDate, formatMontant } from "@/utils/format";
import { buildAnnonceContactState } from "@/utils/annonceContact";

export function AnnonceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const annonceQuery = useAnnonceQuery(Number(id));
  const medias = useMediaItems("ANNONCE", Number(id));
  const navigate = useNavigate();

  if (annonceQuery.isLoading) return <LoadingSpinner fullScreen text="Chargement…" />;
  if (!annonceQuery.data)
    return (
      <PageLayout>
        <EmptyState title="Annonce introuvable" />
      </PageLayout>
    );

  const annonce = annonceQuery.data;

  return (
    <PageLayout narrow decorated>
      <ArrowLink to="/annonces" direction="back" className="mb-4">
        Retour aux annonces
      </ArrowLink>

      <MediaGallery items={medias.isLoading ? [] : medias.items.length > 0 ? medias.items : getAnnonceGallery(annonce.idAnnonce)} alt={annonce.titre} />

      <div className="mt-6 rounded-2xl border border-primary-100/60 bg-white p-6 shadow-sm">
        <Badge variant={statutToBadgeVariant(annonce.statut)}>{annonce.statut}</Badge>
        <h1 className="mt-2 font-heading text-2xl font-bold text-slate-900 md:text-3xl">{annonce.titre}</h1>
        {annonce.localisation && <p className="text-slate-500">{annonce.localisation}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-primary-100/60 py-6">
          <div>
            <p className="text-sm text-slate-500">Prix</p>
            <p className="font-heading text-3xl font-bold text-primary-700">{formatMontant(annonce.prix)}</p>
          </div>
          <Button
            size="lg"
            variant="accent"
            icon={<MessageCircle size={18} />}
            onClick={() => navigate("/contact", { state: buildAnnonceContactState(annonce.titre) })}
          >
            Contacter l&apos;agence
          </Button>
        </div>

        <DetailSectionTitle>Description</DetailSectionTitle>
        <p className="mt-2 whitespace-pre-line text-slate-600">{annonce.description ?? "Aucune description fournie."}</p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {annonce.typeAnnonce && (
            <div className="flex items-start gap-3 rounded-xl border border-primary-100/60 p-4">
              <Tag className="mt-0.5 text-primary-600" size={20} aria-hidden="true" />
              <div>
                <dt className="text-sm text-slate-500">Type</dt>
                <dd className="font-semibold text-slate-800">{annonce.typeAnnonce}</dd>
              </div>
            </div>
          )}
          {annonce.localisation && (
            <div className="flex items-start gap-3 rounded-xl border border-primary-100/60 p-4">
              <MapPin className="mt-0.5 text-primary-600" size={20} aria-hidden="true" />
              <div>
                <dt className="text-sm text-slate-500">Localisation</dt>
                <dd className="font-semibold text-slate-800">{annonce.localisation}</dd>
              </div>
            </div>
          )}
        </dl>

        <p className="mt-6 text-sm text-slate-500">
          Publiée le {formatDate(annonce.datePublication)} · Expire le {formatDate(annonce.dateExpiration)}
        </p>
      </div>
    </PageLayout>
  );
}
