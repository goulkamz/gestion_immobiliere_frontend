import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CalendarCheck, MapPin, Tag, User } from "lucide-react";
import { ArrowLink, Button, DetailFact, DetailSectionTitle, EmptyState, MediaGallery, LoadingSpinner, PageLayout, StatutBadge } from "@/components/ui";
import { useBienServiceQuery } from "@/hooks/queries/usePublicCatalog";
import { useAuthGate, type ResumeAction } from "@/hooks/useAuthGate";
import { useMediaItems } from "@/hooks/queries/useMedias";
import { getBienServiceGallery } from "@/utils/media";
import { formatMontant } from "@/utils/format";
import { ReserveBienServiceModal } from "../components/ReserveBienServiceModal";
import type { BienServiceResponse } from "@/api/types";

export function BienServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bienQuery = useBienServiceQuery(Number(id));
  const medias = useMediaItems("BIEN_SERVICE", Number(id));
  const guard = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();
  const [reserving, setReserving] = useState<BienServiceResponse | null>(null);

  // Reprise automatique après un aller-retour par la connexion : pas besoin de recliquer "Réserver".
  useEffect(() => {
    const resume = (location.state as { resume?: ResumeAction } | null)?.resume;
    if (resume && "reserveBienServiceId" in resume && bienQuery.data?.idBienService === resume.reserveBienServiceId) {
      // Dépend de données chargées de façon asynchrone (requête) et déclenche une vraie
      // navigation : ne peut pas être calculé pendant le rendu, usage légitime d'un effet.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReserving(bienQuery.data);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, bienQuery.data, navigate]);

  if (bienQuery.isLoading) return <LoadingSpinner fullScreen text="Chargement…" />;
  if (!bienQuery.data)
    return (
      <PageLayout>
        <EmptyState title="Bien ou service introuvable" />
      </PageLayout>
    );

  const bien = bienQuery.data;

  return (
    <PageLayout decorated>
      <div className="mx-auto max-w-4xl">
        <ArrowLink to="/catalogue" direction="back" className="mb-4">
          Retour au catalogue
        </ArrowLink>

        <MediaGallery items={medias.isLoading ? [] : medias.items.length > 0 ? medias.items : getBienServiceGallery(bien.idBienService, bien.libelleCategorie, bien.libelle)} alt={bien.libelle} />

        <div className="mt-6 rounded-2xl border border-primary-100/60 bg-white p-6 shadow-sm">
          <StatutBadge statut={bien.disponibilite} />
          <h1 className="mt-2 font-heading text-2xl font-bold text-slate-900 md:text-3xl">{bien.libelle}</h1>
          <p className="text-slate-500">
            {bien.libelleCategorie} · {bien.nomSecteur}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-primary-50 p-4">
            <div>
              <p className="text-sm text-slate-500">{bien.prixJournalier ? "Prix journalier" : "Prix mensuel"}</p>
              <p className="font-heading text-3xl font-bold text-primary-700">{formatMontant(bien.prixJournalier ?? bien.prixMensuel)}</p>
            </div>
            <Button
              size="lg"
              variant="accent"
              icon={<CalendarCheck size={18} />}
              onClick={() => guard(() => setReserving(bien), { reserveBienServiceId: bien.idBienService })}
            >
              Réserver ce bien
            </Button>
          </div>

          <DetailSectionTitle>Description</DetailSectionTitle>
          <p className="mt-2 whitespace-pre-line text-slate-600">{bien.description ?? "Aucune description fournie par l'agence."}</p>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DetailFact icon={Tag} label="Catégorie" value={bien.libelleCategorie} />
            <DetailFact icon={MapPin} label="Secteur" value={bien.nomSecteur} />
            <DetailFact icon={User} label="Géré par" value={bien.nomGestionnaire} />
          </dl>
        </div>
      </div>

      <ReserveBienServiceModal bien={reserving} onClose={() => setReserving(null)} />
    </PageLayout>
  );
}
