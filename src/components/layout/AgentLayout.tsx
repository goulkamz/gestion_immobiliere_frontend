import { Outlet } from "react-router-dom";
import { PageLayout } from "@/components/ui";
import { useAgentUiStore } from "@/store/agentUiStore";
import { AgentSidebar } from "./AgentSidebar";
import { AgentVilleSelect } from "./AgentVilleSelect";

/** Layout de l'espace agent : sidebar de navigation (repliable) + contenu de la sous-route active, avec le sélecteur de ville. */
export function AgentLayout() {
  const collapsed = useAgentUiStore((s) => s.sidebarCollapsed);
  const ville = useAgentUiStore((s) => s.ville);

  return (
    <PageLayout>
      <div className={`grid grid-cols-1 gap-6 ${collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <AgentSidebar />
        <div className="min-w-0">
          <div className="mb-4">
            <AgentVilleSelect />
          </div>
          {/* key : changer de ville remet à zéro la page, la recherche et les filtres de la liste affichée. */}
          <div key={ville}>
            <Outlet />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
