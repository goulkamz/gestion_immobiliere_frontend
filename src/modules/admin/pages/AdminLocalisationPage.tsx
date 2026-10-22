import { useState } from "react";
import { Building2, Globe, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { PaysSection } from "../localisation/PaysSection";
import { SecteursSection } from "../localisation/SecteursSection";
import { VillesSection } from "../localisation/VillesSection";

type Onglet = "pays" | "villes" | "secteurs";

const tabClass = (actif: boolean) =>
  `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
    actif ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
  }`;

/** Pays, villes et secteurs : la hiérarchie utilisée par les annonces, les cours et les biens. */
export function AdminLocalisationPage() {
  const [onglet, setOnglet] = useState<Onglet>("villes");

  return (
    <div>
      <PageHeader tone="indigo" title="Localisation" description="Les pays, les villes et les secteurs proposés dans les formulaires et les filtres du site." />

      <div className="mb-4 inline-flex rounded-xl border border-primary-100 bg-primary-50/60 p-1">
        <button type="button" onClick={() => setOnglet("pays")} className={tabClass(onglet === "pays")}>
          <Globe size={15} aria-hidden="true" />
          Pays
        </button>
        <button type="button" onClick={() => setOnglet("villes")} className={tabClass(onglet === "villes")}>
          <Building2 size={15} aria-hidden="true" />
          Villes
        </button>
        <button type="button" onClick={() => setOnglet("secteurs")} className={tabClass(onglet === "secteurs")}>
          <MapPin size={15} aria-hidden="true" />
          Secteurs
        </button>
      </div>

      {onglet === "pays" && <PaysSection />}
      {onglet === "villes" && <VillesSection />}
      {onglet === "secteurs" && <SecteursSection />}
    </div>
  );
}
