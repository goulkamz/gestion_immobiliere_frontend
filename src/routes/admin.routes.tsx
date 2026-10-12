import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const adminRoutes = (
  <Route
    path="espace-admin"
    element={
      <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
        <ComingSoon title="Administration" />
      </ProtectedRoute>
    }
  />
);
