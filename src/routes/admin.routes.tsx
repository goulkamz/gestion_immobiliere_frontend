import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";

const AdminDashboardPage = lazy(() =>
  import("@/modules/admin/pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminLocalisationPage = lazy(() =>
  import("@/modules/admin/pages/AdminLocalisationPage").then((m) => ({ default: m.AdminLocalisationPage })),
);
const AdminParametresPage = lazy(() =>
  import("@/modules/admin/pages/AdminParametresPage").then((m) => ({ default: m.AdminParametresPage })),
);
const AdminJournalPage = lazy(() =>
  import("@/modules/admin/pages/AdminJournalPage").then((m) => ({ default: m.AdminJournalPage })),
);
const AdminRapportsPage = lazy(() =>
  import("@/modules/admin/pages/AdminRapportsPage").then((m) => ({ default: m.AdminRapportsPage })),
);
// Pages de l'espace agent réutilisées telles quelles (elles gèrent le rôle admin)
const AgentUtilisateursPage = lazy(() =>
  import("@/modules/agent/pages/AgentUtilisateursPage").then((m) => ({ default: m.AgentUtilisateursPage })),
);
const AgentTemoignagesPage = lazy(() =>
  import("@/modules/agent/pages/AgentTemoignagesPage").then((m) => ({ default: m.AgentTemoignagesPage })),
);

export const adminRoutes = (
  <Route
    path="espace-admin"
    element={
      <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AdminDashboardPage />} />
    <Route path="utilisateurs" element={<AgentUtilisateursPage />} />
    <Route path="temoignages" element={<AgentTemoignagesPage />} />
    <Route path="localisation" element={<AdminLocalisationPage />} />
    <Route path="parametres" element={<AdminParametresPage />} />
    <Route path="journal" element={<AdminJournalPage />} />
    <Route path="rapports" element={<AdminRapportsPage />} />
  </Route>
);
