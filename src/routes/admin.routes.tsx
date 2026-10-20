import { lazy } from "react";
import { Route } from "react-router-dom";
import { Construction } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Pages déjà construites dans l'espace agent, réutilisées telles quelles (elles gèrent le rôle admin)
const AdminDashboardPage = lazy(() =>
  import("@/modules/admin/pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })),
);
const AgentUtilisateursPage = lazy(() =>
  import("@/modules/agent/pages/AgentUtilisateursPage").then((m) => ({ default: m.AgentUtilisateursPage })),
);
const AgentTemoignagesPage = lazy(() =>
  import("@/modules/agent/pages/AgentTemoignagesPage").then((m) => ({ default: m.AgentTemoignagesPage })),
);

/** Page à venir dans une prochaine tranche de l'espace admin. */
function Bientot({ title }: { title: string }) {
  return (
    <div>
      <PageHeader tone="indigo" title={title} />
      <EmptyState
        icon={<Construction size={36} />}
        title="Section en cours de construction"
        description="Cette page arrive dans une prochaine étape de l'espace admin."
      />
    </div>
  );
}

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
    <Route path="localisation" element={<Bientot title="Localisation" />} />
    <Route path="parametres" element={<Bientot title="Paramètres" />} />
    <Route path="journal" element={<Bientot title="Journal d'audit" />} />
    <Route path="rapports" element={<Bientot title="Rapports mensuels" />} />
  </Route>
);
