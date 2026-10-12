import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSessionStore, selectIsAuthenticated, selectRole } from "@/store/sessionStore";
import type { Role } from "@/api/types";
import { LoadingSpinner } from "@/components/ui";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: ReactNode;
}

const ROLE_HOME: Record<Role, string> = {
  ROLE_CLIENT: "/espace-client",
  ROLE_BAILLEUR: "/espace-bailleur",
  ROLE_AGENT: "/espace-agent",
  ROLE_ADMIN: "/espace-admin",
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const location = useLocation();
  const isLoading = useSessionStore((s) => s.isLoading);
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const role = useSessionStore(selectRole);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Vérification de la session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={role ? ROLE_HOME[role] : "/"} replace />;
  }

  return <>{children}</>;
}
