import { Outlet } from "react-router-dom";
import { PageLayout } from "@/components/ui";
import { useAgentUiStore } from "@/store/agentUiStore";
import { AgentSidebar } from "./AgentSidebar";

/** Layout de l'espace agent : sidebar de navigation (repliable) + contenu de la sous-route active. */
export function AgentLayout() {
  const collapsed = useAgentUiStore((s) => s.sidebarCollapsed);

  return (
    <PageLayout>
      <div className={`grid gap-6 ${collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <AgentSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  );
}
