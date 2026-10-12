import { Link } from "react-router-dom";
import { Button, PageLayout } from "@/components/ui";

export function NotFoundPage() {
  return (
    <PageLayout narrow>
      <div className="py-20 text-center">
        <p className="font-heading text-6xl font-bold text-primary-600">404</p>
        <h1 className="mt-4 text-xl font-semibold text-slate-800">Page introuvable</h1>
        <p className="mt-2 text-sm text-slate-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    </PageLayout>
  );
}
