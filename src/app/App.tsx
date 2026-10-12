import { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LoadingSpinner } from "@/components/ui";
import { useMeQuery } from "@/hooks/queries/useAuth";
import { registerSessionExpiredHandler } from "@/api/http";
import { useSessionStore } from "@/store/sessionStore";
import { publicRoutes } from "@/routes/public.routes";
import { authRoutes } from "@/routes/auth.routes";
import { clientRoutes } from "@/routes/client.routes";
import { bailleurRoutes } from "@/routes/bailleur.routes";
import { agentRoutes } from "@/routes/agent.routes";
import { adminRoutes } from "@/routes/admin.routes";
import { NotFoundPage } from "@/modules/public/pages/NotFoundPage";

export function App() {
  useMeQuery();
  const clearSession = useSessionStore((s) => s.clear);

  useEffect(() => {
    registerSessionExpiredHandler(clearSession);
  }, [clearSession]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <Suspense fallback={<LoadingSpinner fullScreen text="Chargement…" />}>
        <Routes>
          {publicRoutes}
          {authRoutes}
          {clientRoutes}
          {bailleurRoutes}
          {agentRoutes}
          {adminRoutes}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={3500} newestOnTop theme="light" />
    </div>
  );
}
