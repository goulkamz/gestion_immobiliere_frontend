import { Outlet } from "react-router-dom";
import { PageLayout } from "@/components/ui";
import { useAgentUiStore } from "@/store/agentUiStore";
import { AdminSidebar } from "./AdminSidebar";

/** Layout de l'espace admin : sidebar de navigation (repliable) + contenu de la sous-route active. */
export function AdminLayout() {
  const collapsed = useAgentUiStore((s) => s.sidebarCollapsed);

  return (
    <PageLayout>
      <div className={`grid grid-cols-1 gap-6 ${collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <AdminSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  );
}
