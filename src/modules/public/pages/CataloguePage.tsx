import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { EmptyState, LoadingSpinner, PageHeader, PageLayout, Pagination } from "@/components/ui";
import { MediaPropertyCard } from "../components/MediaPropertyCard";
import { getBienServiceImage, getMaisonImage } from "@/utils/media";
import { useBiensServicesQuery, useMaisonsQuery } from "@/hooks/queries/usePublicCatalog";
import { useAuthGate, type ResumeAction } from "@/hooks/useAuthGate";
import { formatMontant } from "@/utils/format";
import { ReserveMaisonModal } from "../components/ReserveMaisonModal";
import { ReserveBienServiceModal } from "../components/ReserveBienServiceModal";
import type { BienServiceResponse, MaisonResponse } from "@/api/types";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function matchesMaison(maison: MaisonResponse, term: string): boolean {
  const haystack = normalize(
    [maison.nomCommunMaison, maison.typeMaison, maison.referenceCour].filter(Boolean).join(" "),
  );
  return haystack.includes(term);
}

function matchesBienService(bien: BienServiceResponse, term: string): boolean {
  const haystack = normalize([bien.libelle, bien.libelleCategorie, bien.nomSecteur].filter(Boolean).join(" "));
  return haystack.includes(term);
}

type CatalogueTab = "maisons" | "biens-services";

const PAGE_SIZE = 12;

function readInitialTab(value: string | null): CatalogueTab {
  return value === "biens-services" ? "biens-services" : "maisons";
}

export function CataloguePage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<CatalogueTab>(() => readInitialTab(searchParams.get("tab")));
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const guard = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();
  const [reservingMaison, setReservingMaison] = useState<MaisonResponse | null>(null);
  const [reservingBien, setReservingBien] = useState<BienServiceResponse | null>(null);

  // Le public ne voit jamais un bien indisponible : filtré côté serveur pour les maisons
  // (paramètre `statut` supporté par l'API), côté client pour les biens/services (non supporté par l'API).
  const maisonsQuery = useMaisonsQuery({ page, size: PAGE_SIZE, statut: "DISPONIBLE" });
  const biensQuery = useBiensServicesQuery({ page, size: PAGE_SIZE });
  const biensDisponibles = useMemo(
    () => biensQuery.data?.content.filter((bien) => bien.disponibilite === "DISPONIBLE") ?? [],
    [biensQuery.data],
  );

  const term = normalize(search);
  const maisonsFiltrees = useMemo(
    () => (term ? (maisonsQuery.data?.content ?? []).filter((m) => matchesMaison(m, term)) : maisonsQuery.data?.content ?? []),
    [maisonsQuery.data, term],
  );
  const biensFiltres = useMemo(
    () => (term ? biensDisponibles.filter((b) => matchesBienService(b, term)) : biensDisponibles),
    [biensDisponibles, term],
  );

  function changeTab(next: CatalogueTab) {
    setTab(next);
    setPage(0);
  }

  // Reprise automatique après un aller-retour par la connexion : pas besoin de recliquer "Réserver".
  useEffect(() => {
    const resume = (location.state as { resume?: ResumeAction } | null)?.resume;
    if (!resume) return;
    // Dépend de données chargées de façon asynchrone (requête) et déclenche une vraie
    // navigation : ne peut pas être calculé pendant le rendu, usage légitime d'un effet.
    if ("reserveMaisonId" in resume) {
      const found = maisonsQuery.data?.content.find((m) => m.idMaison === resume.reserveMaisonId);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTab("maisons");
        setReservingMaison(found);
        navigate(location.pathname + location.search, { replace: true, state: null });
      }
    } else if ("reserveBienServiceId" in resume) {
      const found = biensQuery.data?.content.find((b) => b.idBienService === resume.reserveBienServiceId);
      if (found) {
        setTab("biens-services");
        setReservingBien(found);
        navigate(location.pathname + location.search, { replace: true, state: null });
      }
    }
  }, [location.state, location.pathname, location.search, maisonsQuery.data, biensQuery.data, navigate]);

  const activeQuery = tab === "maisons" ? maisonsQuery : biensQuery;

  return (
    <PageLayout decorated>
      <PageHeader title="Catalogue" description="Maisons à louer et biens/services disponibles auprès de l'agence." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-primary-100/70 bg-white p-1">
          <button
            type="button"
            onClick={() => changeTab("maisons")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "maisons" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-primary-50"}`}
          >
            Maisons
          </button>
          <button
            type="button"
            onClick={() => changeTab("biens-services")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "biens-services" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-primary-50"}`}
          >
            Biens & services
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans le catalogue…"
            aria-label="Rechercher dans le catalogue"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          />
        </div>
      </div>

      {activeQuery.isLoading && <LoadingSpinner text="Chargement du catalogue…" />}

      {tab === "maisons" && maisonsQuery.data && (
        <>
          {maisonsFiltrees.length === 0 ? (
            <EmptyState title={term ? "Aucune maison ne correspond à votre recherche" : "Aucune maison disponible pour le moment"} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {maisonsFiltrees.map((maison) => (
                <MediaPropertyCard
                  key={maison.idMaison}
                  entiteType="MAISON"
                  entiteId={maison.idMaison}
                  fallbackImageUrl={getMaisonImage(maison.idMaison)}
                  title={maison.nomCommunMaison ?? `Maison #${maison.idMaison}`}
                  description={`${maison.typeMaison ?? "Type non précisé"} · Cour ${maison.referenceCour}${maison.nombrePiece ? ` · ${maison.nombrePiece} pièce(s)` : ""}`}
                  priceLabel={`${formatMontant(maison.loyer)} / mois`}
                  detailHref={`/catalogue/maisons/${maison.idMaison}`}
                  onReserve={() => guard(() => setReservingMaison(maison), { reserveMaisonId: maison.idMaison })}
                />
              ))}
            </div>
          )}
          {!term && (
            <Pagination
              currentPage={maisonsQuery.data.page.number}
              totalPages={maisonsQuery.data.page.totalPages}
              totalElements={maisonsQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {tab === "biens-services" && biensQuery.data && (
        <>
          {biensFiltres.length === 0 ? (
            <EmptyState title={term ? "Aucun bien ne correspond à votre recherche" : "Aucun bien ou service disponible pour le moment"} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {biensFiltres.map((bien) => (
                <MediaPropertyCard
                  key={bien.idBienService}
                  entiteType="BIEN_SERVICE"
                  entiteId={bien.idBienService}
                  fallbackImageUrl={getBienServiceImage(bien.idBienService, bien.libelleCategorie, bien.libelle)}
                  title={bien.libelle}
                  description={bien.description ?? `${bien.libelleCategorie} · ${bien.nomSecteur}`}
                  priceLabel={
                    bien.prixJournalier ? `${formatMontant(bien.prixJournalier)} / jour` : formatMontant(bien.prixMensuel)
                  }
                  detailHref={`/catalogue/biens-services/${bien.idBienService}`}
                  onReserve={() => guard(() => setReservingBien(bien), { reserveBienServiceId: bien.idBienService })}
                />
              ))}
            </div>
          )}
          {!term && (
            <Pagination
              currentPage={biensQuery.data.page.number}
              totalPages={biensQuery.data.page.totalPages}
              totalElements={biensQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ReserveMaisonModal maison={reservingMaison} onClose={() => setReservingMaison(null)} />
      <ReserveBienServiceModal bien={reservingBien} onClose={() => setReservingBien(null)} />
    </PageLayout>
  );
}
