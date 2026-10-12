import { Home, Building2 } from "lucide-react";
import { FormCard, PageLayout } from "@/components/ui";
import { OffreForm } from "../components/OffreForm";

export function OffreRequestPage() {
  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-3.jpg">
      <FormCard
        tone="indigo"
        icon={Building2}
        title="Proposer un bien"
        description="Propriétaire d'une cour, d'un véhicule ou d'un équipement ? Proposez-le à l'agence pour qu'elle le gère pour vous."
        maxWidthClassName="max-w-lg"
      >
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-100 bg-accent-50 p-4 text-sm text-accent-800">
          <Home size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Après étude de votre proposition, un agent vous contacte pour finaliser l'enregistrement du bien et, le cas
            échéant, un mandat de gestion.
          </p>
        </div>
        <OffreForm />
      </FormCard>
    </PageLayout>
  );
}
