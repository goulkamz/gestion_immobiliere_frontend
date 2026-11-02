import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, X } from "lucide-react";
import { useTwoFactorStatusQuery } from "@/hooks/queries/useAuth";

const CLE_MASQUE = "bandeau2faMasque";

function lireMasque(): boolean {
  try {
    return sessionStorage.getItem(CLE_MASQUE) === "1";
  } catch {
    return false;
  }
}

/** Bandeau discret invitant le personnel à activer la double authentification (masquable pour la session). */
export function TwoFactorBanner() {
  const { data } = useTwoFactorStatusQuery();
  const [masque, setMasque] = useState(lireMasque);

  if (!data || !data.disponible || data.actif || masque) return null;

  function masquer() {
    try {
      sessionStorage.setItem(CLE_MASQUE, "1");
    } catch {
      /* stockage indisponible : le bandeau se masque simplement pour cette vue */
    }
    setMasque(true);
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <ShieldAlert size={16} aria-hidden="true" className="shrink-0" />
      <p className="flex-1">
        Protégez votre compte avec la double authentification.{" "}
        <Link to="/profil" className="font-medium underline">
          Activer dans mon profil
        </Link>
      </p>
      <button type="button" onClick={masquer} aria-label="Masquer ce message" className="shrink-0 text-amber-700 hover:text-amber-900">
        <X size={16} />
      </button>
    </div>
  );
}
