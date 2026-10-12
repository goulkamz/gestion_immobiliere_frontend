import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Banknote, CalendarCheck, DoorOpen, Landmark, Wallet } from "lucide-react";
import { ArrowLink, Button, DetailFact, DetailSectionTitle, EmptyState, MediaGallery, LoadingSpinner, PageLayout, StatutBadge } from "@/components/ui";
import { useMaisonQuery } from "@/hooks/queries/usePublicCatalog";
import { useAuthGate, type ResumeAction } from "@/hooks/useAuthGate";
import { useMediaItems } from "@/hooks/queries/useMedias";
import { getMaisonGallery } from "@/utils/media";
import { formatMontant } from "@/utils/format";
import { ReserveMaisonModal } from "../components/ReserveMaisonModal";
import type { MaisonResponse } from "@/api/types";

export function MaisonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const maisonQuery = useMaisonQuery(Number(id));
  const medias = useMediaItems("MAISON", Number(id));
  const guard = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();
  const [reserving, setReserving] = useState<MaisonResponse | null>(null);

  // Reprise automatique après un aller-retour par la connexion : pas besoin de recliquer "Réserver".
  useEffect(() => {
    const resume = (location.state as { resume?: ResumeAction } | null)?.resume;
    if (resume && "reserveMaisonId" in resume && maisonQuery.data?.idMaison === resume.reserveMaisonId) {
      // Dépend de données chargées de façon asynchrone (requête) et déclenche une vraie
      // navigation : ne peut pas être calculé pendant le rendu, usage légitime d'un effet.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReserving(maisonQuery.data);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, maisonQuery.data, navigate]);

  if (maisonQuery.isLoading) return <LoadingSpinner fullScreen text="Chargement…" />;
  if (!maisonQuery.data)
    return (
      <PageLayout>
        <EmptyState title="Maison introuvable" />
      </PageLayout>
    );

  const maison = maisonQuery.data;
  const title = maison.nomCommunMaison ?? `Maison #${maison.idMaison}`;

  return (
    <PageLayout decorated>
      <div className="mx-auto max-w-4xl">
        <ArrowLink to="/catalogue" direction="back" className="mb-4">
          Retour au catalogue
        </ArrowLink>

        <MediaGallery items={medias.isLoading ? [] : medias.items.length > 0 ? medias.items : getMaisonGallery(maison.idMaison)} alt={title} />

        <div className="mt-6 rounded-2xl border border-primary-100/60 bg-white p-6 shadow-sm">
          <StatutBadge statut={maison.statut} />
          <h1 className="mt-2 font-heading text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
          <p className="text-slate-500">
            {maison.typeMaison ?? "Type non précisé"} · Cour {maison.referenceCour}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-primary-50 p-4">
            <div>
              <p className="text-sm text-slate-500">Loyer mensuel</p>
              <p className="font-heading text-3xl font-bold text-primary-700">{formatMontant(maison.loyer)}</p>
            </div>
            <Button
              size="lg"
              variant="accent"
              icon={<CalendarCheck size={18} />}
              onClick={() => guard(() => setReserving(maison), { reserveMaisonId: maison.idMaison })}
            >
              Réserver cette maison
            </Button>
          </div>

          <DetailSectionTitle>Description</DetailSectionTitle>
          <p className="mt-2 whitespace-pre-line text-slate-600">
            Maison de type {maison.typeMaison?.toLowerCase() ?? "non précisé"}
            {maison.nombrePiece ? `, composée de ${maison.nombrePiece} pièce(s)` : ""}, située dans la cour{" "}
            {maison.referenceCour}. Statut actuel : <strong>{maison.statut.toLowerCase()}</strong>.
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailFact icon={DoorOpen} label="Pièces" value={maison.nombrePiece ?? "-"} />
            <DetailFact icon={Wallet} label="Caution" value={formatMontant(maison.caution)} />
            <DetailFact icon={Banknote} label="Avance" value={maison.avance !== null ? formatMontant(maison.avance) : "-"} />
            <DetailFact icon={Landmark} label="Mois de caution requis" value={maison.nombreMoisCaution ?? "-"} />
          </dl>
        </div>
      </div>

      <ReserveMaisonModal maison={reserving} onClose={() => setReserving(null)} />
    </PageLayout>
  );
}
