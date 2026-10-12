import { Link } from "react-router-dom";
import { MessageSquareQuote, Sparkles } from "lucide-react";
import { FormCard, PageLayout } from "@/components/ui";
import { TemoignageForm } from "../components/TemoignageForm";

export function TemoignageRequestPage() {
  return (
    <PageLayout narrow decorated>
      <FormCard
        tone="indigo"
        icon={MessageSquareQuote}
        title="Laisser un avis"
        description="Propriétaire, locataire ou partenaire : partagez votre expérience avec l'agence."
        maxWidthClassName="max-w-lg"
        footer={
          <Link to="/" className="font-medium text-primary-700 hover:underline">
            Annuler et revenir à l'accueil
          </Link>
        }
      >
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-100 bg-accent-50 p-4 text-sm text-accent-800">
          <Sparkles size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>Votre témoignage est relu par un membre de l'équipe avant publication sur la page d'accueil.</p>
        </div>
        <TemoignageForm />
      </FormCard>
    </PageLayout>
  );
}
