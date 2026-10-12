import { Search, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { FormCard, PageLayout } from "@/components/ui";
import { DemandeForm } from "../components/DemandeForm";

export function DemandeRequestPage() {
  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-6.jpg">
      <FormCard
        tone="indigo"
        icon={ClipboardList}
        title="Déposer une demande"
        description="Vous cherchez un logement, un véhicule ou un service ? Décrivez votre besoin, un agent vous recontacte avec des propositions."
        maxWidthClassName="max-w-lg"
      >
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
          <Search size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Vous pouvez aussi parcourir directement le{" "}
            <Link to="/catalogue" className="font-semibold text-primary-900 transition-colors hover:text-primary-600">
              catalogue
            </Link>{" "}
            si vous savez déjà ce que vous cherchez.
          </p>
        </div>
        <DemandeForm />
      </FormCard>
    </PageLayout>
  );
}
