import { Outlet } from "react-router-dom";
import { PageLayout } from "@/components/ui";
import { useClientUiStore } from "@/store/clientUiStore";
import { ClientSidebar } from "./ClientSidebar";

/** Layout de l'espace client : sidebar de navigation (repliable) + contenu de la sous-route active. */
export function ClientLayout() {
  const collapsed = useClientUiStore((s) => s.sidebarCollapsed);

  return (
    <PageLayout>
      <div className={`grid gap-6 ${collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <ClientSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  );
}
