import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  FileCheck2,
  Home as HomeIcon,
  Key,
  MapPin,
  Search,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import {
  Button,
  Carousel,
  CarouselItem,
  EmptyState,
  HeroCarousel,
  LoadingSpinner,
  PageLayout,
  type HeroSlide,
} from "@/components/ui";
import { AnnoncesTicker } from "../components/AnnoncesTicker";
import { MediaPropertyCard } from "../components/MediaPropertyCard";
import { CategoryShowcase } from "../components/CategoryShowcase";
import { DomainesSection } from "../components/DomainesSection";
import { HowItWorks } from "../components/HowItWorks";
import { ReserveMaisonModal } from "../components/ReserveMaisonModal";
import { SectionHeader } from "../components/SectionHeader";
import { StatsBanner } from "../components/StatsBanner";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { getAnnonceImage, getMaisonImage } from "@/utils/media";
import { useAuthGate, type ResumeAction } from "@/hooks/useAuthGate";
import { useBiensServicesQuery, useMaisonsQuery, usePublicStatsQuery, useRecentAnnoncesQuery } from "@/hooks/queries/usePublicCatalog";
import { formatDate, formatMontant } from "@/utils/format";
import { buildAnnonceContactState } from "@/utils/annonceContact";
import type { BienServiceResponse, MaisonResponse } from "@/api/types";

const HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: "Location simplifiée",
    title: "Trouvez votre prochain logement avec GestImmo",
    highlight: "GestImmo",
    subtitle: "Maisons, cours et biens gérés en toute transparence par une agence de confiance.",
    imageUrl: "/images/maison-1.jpg",
    gradientClassName: "from-primary-950/90 via-primary-900/70 to-primary-800/40",
  },
  {
    eyebrow: "Propriétaires",
    title: "Confiez la gestion de votre bien à des professionnels",
    subtitle: "Mandat de gestion, encaissement des loyers, suivi des locataires : nous nous occupons de tout.",
    imageUrl: "/images/maison-6.jpg",
    gradientClassName: "from-indigo-950/90 via-primary-900/75 to-primary-800/45",
  },
  {
    eyebrow: "Biens & services",
    title: "Véhicules, équipements, services… louez à la journée ou au mois",
    subtitle: "Un catalogue de biens et services complémentaire à l'offre de logements.",
    imageUrl: "/images/vehicule-1.jpg",
    gradientClassName: "from-primary-950/90 via-indigo-900/75 to-primary-900/50",
  },
];

const STEPS = [
  { icon: Search, title: "Explorez", description: "Parcourez le catalogue de maisons, biens et services disponibles." },
  { icon: ClipboardList, title: "Exprimez votre besoin", description: "Déposez une demande ou réservez directement en ligne." },
  { icon: FileCheck2, title: "Validez avec l'agence", description: "Un agent confirme votre dossier et le paiement au comptoir." },
  { icon: Key, title: "Emménagez", description: "Récupérez les clés et profitez de votre nouveau logement." },
];

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const guard = useAuthGate();
  const [reservingMaison, setReservingMaison] = useState<MaisonResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const statsQuery = usePublicStatsQuery();
  const annoncesQuery = useRecentAnnoncesQuery();
  // Le public ne voit jamais un bien indisponible : filtré côté serveur pour les maisons
  // (paramètre `statut` supporté par l'API), côté client pour les biens/services (non supporté par l'API).
  const maisonsQuery = useMaisonsQuery({ size: 8, statut: "DISPONIBLE" });
  const biensQuery = useBiensServicesQuery({ size: 50 });

  // Reprise automatique après un aller-retour par la connexion : pas besoin de recliquer "Réserver".
  useEffect(() => {
    const resume = (location.state as { resume?: ResumeAction } | null)?.resume;
    if (resume && "reserveMaisonId" in resume) {
      const found = maisonsQuery.data?.content.find((m) => m.idMaison === resume.reserveMaisonId);
      if (found) {
        // Dépend de données chargées de façon asynchrone (requête) et déclenche une vraie
        // navigation : ne peut pas être calculé pendant le rendu, usage légitime d'un effet.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReservingMaison(found);
        navigate(location.pathname, { replace: true, state: null });
      }
    }
  }, [location.state, location.pathname, maisonsQuery.data, navigate]);

  const categoryGroups = useMemo(() => {
    if (!biensQuery.data) return [];
    const groups = new Map<string, BienServiceResponse[]>();
    for (const bien of biensQuery.data.content) {
      if (bien.disponibilite !== "DISPONIBLE") continue;
      const list = groups.get(bien.libelleCategorie) ?? [];
      list.push(bien);
      groups.set(bien.libelleCategorie, list);
    }
    return Array.from(groups.entries())
      .map(([label, items]) => ({ label, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [biensQuery.data]);

  function handleQuickSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = searchTerm.trim();
    navigate(term ? `/catalogue?q=${encodeURIComponent(term)}` : "/catalogue");
  }

  return (
    <>
      <AnnoncesTicker annonces={annoncesQuery.data ?? []} />

      <HeroCarousel slides={HERO_SLIDES}>
        <form
          onSubmit={handleQuickSearch}
          className="flex w-full max-w-2xl overflow-hidden rounded-2xl bg-white/95 shadow-xl"
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Un secteur, un type de bien, une villa…"
            aria-label="Rechercher un bien"
            className="min-w-0 flex-1 bg-transparent px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-base"
          />
          <button
            type="submit"
            aria-label="Rechercher"
            className="flex shrink-0 items-center justify-center bg-primary-600 px-6 text-white transition-colors hover:bg-primary-700"
          >
            <Search size={20} aria-hidden="true" />
          </button>
        </form>
      </HeroCarousel>

      {/* Statistiques clés : cartes flottantes qui chevauchent le bas du hero */}
      <div className="relative z-10 mx-auto -mt-10 max-w-[1600px] px-6 sm:-mt-14 sm:px-10 lg:px-16">
        <section aria-labelledby="stats-title">
          <h2 id="stats-title" className="sr-only">
            Chiffres clés
          </h2>
          {statsQuery.isLoading ? (
            <LoadingSpinner text="Chargement des statistiques…" />
          ) : statsQuery.data ? (
            <StatsBanner
              items={[
                { icon: HomeIcon, label: "Maisons disponibles", value: statsQuery.data.maisonsDisponibles, tone: "primary" },
                { icon: Building2, label: "Biens & services", value: statsQuery.data.biensDisponibles, tone: "accent" },
                { icon: MapPin, label: "Villes couvertes", value: statsQuery.data.villesCouvertes, tone: "primary" },
                { icon: TrendingUp, label: "Locations réalisées", value: statsQuery.data.locationsRealisees, tone: "accent" },
              ]}
            />
          ) : null}
        </section>
      </div>

      <PageLayout>
        {/* Annonces à la une */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-primary-100/60 sm:p-8" aria-labelledby="annonces-title">
          <SectionHeader
            kicker="Actualité"
            title="Annonces à la une"
            action={{ label: "Toutes les annonces", to: "/annonces" }}
          />
          {annoncesQuery.isLoading && <LoadingSpinner />}
          {annoncesQuery.data && annoncesQuery.data.length === 0 && <EmptyState title="Aucune annonce active pour le moment" />}
          {annoncesQuery.data && annoncesQuery.data.length > 0 && (
            <Carousel ariaLabel="Annonces à la une">
              {annoncesQuery.data.map((annonce) => (
                <CarouselItem key={annonce.idAnnonce}>
                  <MediaPropertyCard
                    entiteType="ANNONCE"
                    entiteId={annonce.idAnnonce}
                    fallbackImageUrl={getAnnonceImage(annonce.idAnnonce)}
                    title={annonce.titre}
                    description={annonce.description ?? annonce.localisation ?? "Annonce de l'agence"}
                    priceLabel={annonce.prix !== null ? formatMontant(annonce.prix) : `Publié le ${formatDate(annonce.datePublication)}`}
                    detailHref={`/annonces/${annonce.idAnnonce}`}
                    actionKind="contacter"
                    onReserve={() => navigate("/contact", { state: buildAnnonceContactState(annonce.titre) })}
                  />
                </CarouselItem>
              ))}
            </Carousel>
          )}
        </section>

        {/* Catégories populaires */}
        {categoryGroups.length > 0 && (
          <section
            className="mt-8 rounded-3xl bg-primary-50/50 p-6 ring-1 ring-primary-100/60 sm:p-8"
            aria-labelledby="categories-title"
          >
            <SectionHeader
              kicker="Explorer"
              title="Biens & services en location courte durée"
              description="Véhicules, équipements et services à louer à la journée ou au mois, sans contrat longue durée."
            />
            <CategoryShowcase groups={categoryGroups} />
          </section>
        )}

        {/* Comment ça marche */}
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-primary-100/60 sm:p-8" aria-labelledby="steps-title">
          <SectionHeader kicker="Processus" title="Comment ça marche" />
          <HowItWorks steps={STEPS} />
        </section>

        {/* Derniers biens ajoutés */}
        <section
          className="mt-8 rounded-3xl bg-primary-50/50 p-6 ring-1 ring-primary-100/60 sm:p-8"
          aria-labelledby="derniers-title"
        >
          <SectionHeader
            kicker="Nouveautés"
            title="Maisons en location longue durée"
            description="Logements avec contrat de location, pour plusieurs mois ou années."
            action={{ label: "Voir le catalogue", to: "/catalogue" }}
          />
          {maisonsQuery.isLoading && <LoadingSpinner />}
          {maisonsQuery.data && maisonsQuery.data.content.length > 0 && (
            <Carousel ariaLabel="Derniers biens ajoutés">
              {maisonsQuery.data.content.map((maison) => (
                <CarouselItem key={maison.idMaison}>
                  <MediaPropertyCard
                    entiteType="MAISON"
                    entiteId={maison.idMaison}
                    fallbackImageUrl={getMaisonImage(maison.idMaison)}
                    title={maison.nomCommunMaison ?? `Maison #${maison.idMaison}`}
                    description={`${maison.typeMaison ?? "Type non précisé"} · Cour ${maison.referenceCour}${maison.nombrePiece ? ` · ${maison.nombrePiece} pièce(s)` : ""}`}
                    priceLabel={`${formatMontant(maison.loyer)} / mois`}
                    detailHref={`/catalogue/maisons/${maison.idMaison}`}
                    onReserve={() => guard(() => setReservingMaison(maison), { reserveMaisonId: maison.idMaison })}
                  />
                </CarouselItem>
              ))}
            </Carousel>
          )}
        </section>

        {/* Nos domaines d'intervention */}
        <DomainesSection />

        {/* Témoignages */}
        <TestimonialsSection />

        {/* Double CTA */}
        <section className="relative mt-16 overflow-hidden rounded-2xl bg-linear-to-br from-primary-700 to-primary-900 p-8 text-white md:p-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-400/30 blur-3xl" />
            <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary-300/20 blur-3xl" />
            <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
          </div>
          <div className="relative grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-xl font-bold">Vous êtes propriétaire ?</h2>
              <p className="mt-2 text-primary-100">Confiez la gestion de votre cour ou de votre bien à notre agence.</p>
              <Link to="/proposer-un-bien" className="mt-4 inline-block">
                <Button variant="accent">Proposer un bien</Button>
              </Link>
            </div>
            <div className="md:border-l md:border-white/20 md:pl-8">
              <h2 className="font-heading text-xl font-bold">Vous cherchez un logement ?</h2>
              <p className="mt-2 text-primary-100">Décrivez votre besoin, l'agence vous recontacte avec des propositions.</p>
              <Link to="/deposer-une-demande" className="mt-4 inline-block">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  icon={<UserPlus size={16} />}
                >
                  Déposer une demande
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </PageLayout>

      <ReserveMaisonModal maison={reservingMaison} onClose={() => setReservingMaison(null)} />
    </>
  );
}
