import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AgentLayout } from "@/components/layout/AgentLayout";

const AgentDashboardPage = lazy(() =>
  import("@/modules/agent/pages/AgentDashboardPage").then((m) => ({ default: m.AgentDashboardPage })),
);
const AgentCoursPage = lazy(() => import("@/modules/agent/pages/AgentCoursPage").then((m) => ({ default: m.AgentCoursPage })));
const AgentMaisonsPage = lazy(() => import("@/modules/agent/pages/AgentMaisonsPage").then((m) => ({ default: m.AgentMaisonsPage })));
const AgentCategoriesPage = lazy(() =>
  import("@/modules/agent/pages/AgentCategoriesPage").then((m) => ({ default: m.AgentCategoriesPage })),
);
const AgentBiensServicesPage = lazy(() =>
  import("@/modules/agent/pages/AgentBiensServicesPage").then((m) => ({ default: m.AgentBiensServicesPage })),
);
const AgentMandatsPage = lazy(() => import("@/modules/agent/pages/AgentMandatsPage").then((m) => ({ default: m.AgentMandatsPage })));
const AgentReservationsPage = lazy(() =>
  import("@/modules/agent/pages/AgentReservationsPage").then((m) => ({ default: m.AgentReservationsPage })),
);
const AgentLocationsBiensServicesPage = lazy(() =>
  import("@/modules/agent/pages/AgentLocationsBiensServicesPage").then((m) => ({ default: m.AgentLocationsBiensServicesPage })),
);
const AgentContratsLocationPage = lazy(() =>
  import("@/modules/agent/pages/AgentContratsLocationPage").then((m) => ({ default: m.AgentContratsLocationPage })),
);
const AgentAnnoncesPage = lazy(() => import("@/modules/agent/pages/AgentAnnoncesPage").then((m) => ({ default: m.AgentAnnoncesPage })));
const AgentContactsPage = lazy(() => import("@/modules/agent/pages/AgentContactsPage").then((m) => ({ default: m.AgentContactsPage })));
const AgentDemandesPage = lazy(() => import("@/modules/agent/pages/AgentDemandesPage").then((m) => ({ default: m.AgentDemandesPage })));
const AgentOffresPage = lazy(() => import("@/modules/agent/pages/AgentOffresPage").then((m) => ({ default: m.AgentOffresPage })));
const AgentEcheancesPage = lazy(() => import("@/modules/agent/pages/AgentEcheancesPage").then((m) => ({ default: m.AgentEcheancesPage })));
const AgentReversementsPage = lazy(() =>
  import("@/modules/agent/pages/AgentReversementsPage").then((m) => ({ default: m.AgentReversementsPage })),
);
const AgentTemoignagesPage = lazy(() =>
  import("@/modules/agent/pages/AgentTemoignagesPage").then((m) => ({ default: m.AgentTemoignagesPage })),
);
const AgentUtilisateursPage = lazy(() =>
  import("@/modules/agent/pages/AgentUtilisateursPage").then((m) => ({ default: m.AgentUtilisateursPage })),
);

export const agentRoutes = (
  <Route
    path="espace-agent"
    element={
      <ProtectedRoute allowedRoles={["ROLE_AGENT", "ROLE_ADMIN"]}>
        <AgentLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AgentDashboardPage />} />
    <Route path="utilisateurs" element={<AgentUtilisateursPage />} />
    <Route path="cours"element={<AgentCoursPage />} />
    <Route path="maisons" element={<AgentMaisonsPage />} />
    <Route path="categories" element={<AgentCategoriesPage />} />
    <Route path="biens-services" element={<AgentBiensServicesPage />} />
    <Route path="mandats" element={<AgentMandatsPage />} />
    <Route path="reservations" element={<AgentReservationsPage />} />
    <Route path="locations-biens-services" element={<AgentLocationsBiensServicesPage />} />
    <Route path="contrats-location" element={<AgentContratsLocationPage />} />
    <Route path="annonces" element={<AgentAnnoncesPage />} />
    <Route path="contacts" element={<AgentContactsPage />} />
    <Route path="demandes" element={<AgentDemandesPage />} />
    <Route path="offres" element={<AgentOffresPage />} />
    <Route path="echeances" element={<AgentEcheancesPage />} />
    <Route path="reversements" element={<AgentReversementsPage />} />
    <Route path="temoignages" element={<AgentTemoignagesPage />} />
  </Route>
);
