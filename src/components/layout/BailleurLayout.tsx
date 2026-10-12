import { Outlet } from "react-router-dom";
import { PageLayout } from "@/components/ui";
import { useBailleurUiStore } from "@/store/bailleurUiStore";
import { BailleurSidebar } from "./BailleurSidebar";

/** Layout de l'espace bailleur : sidebar de navigation (repliable) + contenu de la sous-route active. */
export function BailleurLayout() {
  const collapsed = useBailleurUiStore((s) => s.sidebarCollapsed);

  return (
    <PageLayout>
      <div className={`grid gap-6 ${collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <BailleurSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  );
}
