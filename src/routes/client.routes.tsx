import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ClientLayout } from "@/components/layout/ClientLayout";

const ClientDashboardPage = lazy(() =>
  import("@/modules/client/pages/ClientDashboardPage").then((m) => ({ default: m.ClientDashboardPage })),
);
const ClientReservationsPage = lazy(() =>
  import("@/modules/client/pages/ClientReservationsPage").then((m) => ({ default: m.ClientReservationsPage })),
);
const ClientLocationsPage = lazy(() =>
  import("@/modules/client/pages/ClientLocationsPage").then((m) => ({ default: m.ClientLocationsPage })),
);
const ClientContratsPage = lazy(() =>
  import("@/modules/client/pages/ClientContratsPage").then((m) => ({ default: m.ClientContratsPage })),
);
const ClientEcheancesPage = lazy(() =>
  import("@/modules/client/pages/ClientEcheancesPage").then((m) => ({ default: m.ClientEcheancesPage })),
);
const ClientRecusPage = lazy(() => import("@/modules/client/pages/ClientRecusPage").then((m) => ({ default: m.ClientRecusPage })));
const ClientRemboursementsPage = lazy(() =>
  import("@/modules/client/pages/ClientRemboursementsPage").then((m) => ({ default: m.ClientRemboursementsPage })),
);

export const clientRoutes = (
  <Route
    path="espace-client"
    element={
      <ProtectedRoute allowedRoles={["ROLE_CLIENT"]}>
        <ClientLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<ClientDashboardPage />} />
    <Route path="reservations" element={<ClientReservationsPage />} />
    <Route path="locations" element={<ClientLocationsPage />} />
    <Route path="contrats" element={<ClientContratsPage />} />
    <Route path="echeances" element={<ClientEcheancesPage />} />
    <Route path="recus" element={<ClientRecusPage />} />
    <Route path="remboursements" element={<ClientRemboursementsPage />} />
  </Route>
);
