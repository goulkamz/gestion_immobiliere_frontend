import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useSessionStore, selectIsAuthenticated, selectRole } from "@/store/sessionStore";

/** Action à reprendre automatiquement une fois revenu sur la page, après connexion. */
export type ResumeAction = { reserveMaisonId: number } | { reserveBienServiceId: number };

/**
 * Garde d'accès réutilisable pour les actions client (réserver, louer…) déclenchées depuis
 * une page publique : redirige vers la connexion si non authentifié (en mémorisant l'action
 * à reprendre pour ne pas faire recliquer l'utilisateur après connexion), avertit si le rôle
 * n'est pas ROLE_CLIENT, sinon exécute l'action demandée.
 */
export function useAuthGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const role = useSessionStore(selectRole);

  return function guard(onAllowed: () => void, resume?: ResumeAction) {
    if (!isAuthenticated) {
      navigate("/connexion", { state: { from: location, resume } });
      return;
    }
    if (role !== "ROLE_CLIENT") {
      toast.info("Seuls les comptes locataires peuvent réserver en ligne.");
      return;
    }
    onAllowed();
  };
}
