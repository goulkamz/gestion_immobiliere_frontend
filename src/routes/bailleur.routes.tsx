import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { BailleurLayout } from "@/components/layout/BailleurLayout";

const BailleurDashboardPage = lazy(() =>
  import("@/modules/bailleur/pages/BailleurDashboardPage").then((m) => ({ default: m.BailleurDashboardPage })),
);
const BailleurPatrimoinePage = lazy(() =>
  import("@/modules/bailleur/pages/BailleurPatrimoinePage").then((m) => ({ default: m.BailleurPatrimoinePage })),
);
const BailleurMandatsPage = lazy(() =>
  import("@/modules/bailleur/pages/BailleurMandatsPage").then((m) => ({ default: m.BailleurMandatsPage })),
);
const BailleurContratsPage = lazy(() =>
  import("@/modules/bailleur/pages/BailleurContratsPage").then((m) => ({ default: m.BailleurContratsPage })),
);
const BailleurEcheancesPage = lazy(() =>
  import("@/modules/bailleur/pages/BailleurEcheancesPage").then((m) => ({ default: m.BailleurEcheancesPage })),
);
const BailleurRevenusPage = lazy(() =>
  import("@/modules/bailleur/pages/BailleurRevenusPage").then((m) => ({ default: m.BailleurRevenusPage })),
);

export const bailleurRoutes = (
  <Route
    path="espace-bailleur"
    element={
      <ProtectedRoute allowedRoles={["ROLE_BAILLEUR"]}>
        <BailleurLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<BailleurDashboardPage />} />
    <Route path="patrimoine" element={<BailleurPatrimoinePage />} />
    <Route path="mandats" element={<BailleurMandatsPage />} />
    <Route path="contrats" element={<BailleurContratsPage />} />
    <Route path="echeances" element={<BailleurEcheancesPage />} />
    <Route path="revenus" element={<BailleurRevenusPage />} />
  </Route>
);
