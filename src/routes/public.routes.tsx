import { lazy } from "react";
import { Route } from "react-router-dom";

const HomePage = lazy(() => import("@/modules/public/pages/HomePage").then((m) => ({ default: m.HomePage })));
const CataloguePage = lazy(() => import("@/modules/public/pages/CataloguePage").then((m) => ({ default: m.CataloguePage })));
const MaisonDetailPage = lazy(() => import("@/modules/public/pages/MaisonDetailPage").then((m) => ({ default: m.MaisonDetailPage })));
const BienServiceDetailPage = lazy(() =>
  import("@/modules/public/pages/BienServiceDetailPage").then((m) => ({ default: m.BienServiceDetailPage })),
);
const AnnoncesPage = lazy(() => import("@/modules/public/pages/AnnoncesPage").then((m) => ({ default: m.AnnoncesPage })));
const AnnonceDetailPage = lazy(() =>
  import("@/modules/public/pages/AnnonceDetailPage").then((m) => ({ default: m.AnnonceDetailPage })),
);
const ContactPage = lazy(() => import("@/modules/public/pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const DemandeRequestPage = lazy(() =>
  import("@/modules/public/pages/DemandeRequestPage").then((m) => ({ default: m.DemandeRequestPage })),
);
const OffreRequestPage = lazy(() =>
  import("@/modules/public/pages/OffreRequestPage").then((m) => ({ default: m.OffreRequestPage })),
);
const TemoignageRequestPage = lazy(() =>
  import("@/modules/public/pages/TemoignageRequestPage").then((m) => ({ default: m.TemoignageRequestPage })),
);

export const publicRoutes = (
  <>
    <Route index element={<HomePage />} />
    <Route path="catalogue" element={<CataloguePage />} />
    <Route path="catalogue/maisons/:id" element={<MaisonDetailPage />} />
    <Route path="catalogue/biens-services/:id" element={<BienServiceDetailPage />} />
    <Route path="annonces" element={<AnnoncesPage />} />
    <Route path="annonces/:id" element={<AnnonceDetailPage />} />
    <Route path="deposer-une-demande" element={<DemandeRequestPage />} />
    <Route path="proposer-un-bien" element={<OffreRequestPage />} />
    <Route path="laisser-un-avis" element={<TemoignageRequestPage />} />
    <Route path="contact" element={<ContactPage />} />
  </>
);
