import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { FormCard, PageLayout } from "@/components/ui";
import { ContactForm } from "../components/ContactForm";

interface ContactPageState {
  sujet?: string;
  message?: string;
}

export function ContactPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as ContactPageState;

  return (
    <PageLayout narrow decorated backgroundImage="/images/service-2.jpg">
      <FormCard tone="indigo" icon={MessageCircle} title="Nous contacter" description="Une question ? Écrivez-nous, l'agence vous répond rapidement." maxWidthClassName="max-w-lg">
        <ContactForm defaultSujet={state.sujet} defaultMessage={state.message} />
      </FormCard>
    </PageLayout>
  );
}
