import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Mail, MapPin, Phone } from "lucide-react";
import { useVillesQuery } from "@/hooks/queries/usePublicCatalog";
import { DeveloperCredit } from "./DeveloperCredit";
import { PARTENAIRES, type Partenaire } from "./partenaires";

export function Footer() {
  const year = new Date().getFullYear();
  const partenaires = [...PARTENAIRES].sort((a, b) => a.ordre - b.ordre);
  const villesQuery = useVillesQuery();
  const villes = villesQuery.data?.content ?? [];
  const VILLES_MAX_AFFICHEES = 6;
  const villesAffichees = villes.slice(0, VILLES_MAX_AFFICHEES);
  const villesRestantes = villes.length - villesAffichees.length;

  return (
    <footer className="bg-linear-to-br from-primary-800 via-primary-900 to-primary-950 text-primary-100">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-primary-500 to-primary-700 text-white shadow-sm">
              <Building2 size={20} aria-hidden="true" />
            </span>
            GestImmo
          </div>
          <p className="mt-3 text-[15px] text-white/85">
            Location de maisons, biens et services gérés en toute transparence
            par une agence de confiance.
          </p>
        </div>

        <nav aria-label="Liens rapides">
          <FooterHeading>Liens rapides</FooterHeading>
          <ul className="space-y-2 text-[15px] text-white/85">
            <li>
              <Link
                to="/catalogue"
                className="transition-colors hover:text-accent-300"
              >
                Catalogue
              </Link>
            </li>
            <li>
              <Link
                to="/annonces"
                className="transition-colors hover:text-accent-300"
              >
                Annonces
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="transition-colors hover:text-accent-300"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Professionnels">
          <FooterHeading>Professionnels</FooterHeading>
          <ul className="space-y-2 text-[15px] text-white/85">
            <li>
              <Link
                to="/proposer-un-bien"
                className="transition-colors hover:text-accent-300"
              >
                Espace bailleur - proposer un bien
              </Link>
            </li>
            <li>
              <Link
                to="/deposer-une-demande"
                className="transition-colors hover:text-accent-300"
              >
                Déposer une demande
              </Link>
            </li>
            <li>
              <Link
                to="/inscription"
                className="transition-colors hover:text-accent-300"
              >
                Créer un compte
              </Link>
            </li>
          </ul>
        </nav>

        {villes.length > 0 && (
          <nav aria-label="Villes couvertes">
            <FooterHeading>Villes</FooterHeading>
            <ul className="space-y-2 text-[15px] text-white/85">
              {villesAffichees.map((ville) => (
                <li key={ville.idVille}>
                  <Link to="/catalogue" className="transition-colors hover:text-accent-300">
                    {ville.nomVille}
                  </Link>
                </li>
              ))}
              {villesRestantes > 0 && (
                <li>
                  <Link
                    to="/catalogue"
                    className="inline-flex items-center gap-1 font-medium text-accent-300 transition-colors hover:text-accent-200"
                  >
                    +{villesRestantes} autre{villesRestantes > 1 ? "s" : ""}
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}

        <div>
          <FooterHeading>Contact</FooterHeading>
          <ul className="space-y-2 text-[15px] text-white/85">
            <li className="flex items-center gap-2">
              <MapPin
                size={15}
                className="shrink-0 text-accent-400"
                aria-hidden="true"
              />
              Ouagadougou, Burkina Faso
            </li>
            <li className="flex items-center gap-2">
              <Phone
                size={15}
                className="shrink-0 text-accent-400"
                aria-hidden="true"
              />
              <a
                href="tel:+22670000000"
                className="transition-colors hover:text-accent-300"
              >
                +226 70 00 00 00
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail
                size={15}
                className="shrink-0 text-accent-400"
                aria-hidden="true"
              />
              <a
                href="mailto:contact@gestimmo.test"
                className="transition-colors hover:text-accent-300"
              >
                contact@gestimmo.test
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Partenaires */}
      {partenaires.length > 0 && (
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-[1600px] px-5 py-8">
            <h2 className="text-center text-[13px] font-semibold uppercase tracking-wider text-white">
              Nos partenaires
            </h2>
            <span
              className="mx-auto mt-1.5 block h-0.5 w-8 rounded-full bg-accent-400"
              aria-hidden="true"
            />
            <div className="mt-5 grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-4">
              {partenaires.map((partenaire) => (
                <PartenaireLogo key={partenaire.id} partenaire={partenaire} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-white/80">
            © {year} GestImmo. Tous droits réservés.
          </p>
          <DeveloperCredit />
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white">
        {children}
      </h2>
      <span
        className="mt-1.5 block h-0.5 w-8 rounded-full bg-accent-400"
        aria-hidden="true"
      />
    </div>
  );
}

function PartenaireLogo({ partenaire }: { partenaire: Partenaire }) {
  const [failed, setFailed] = useState(false);

  const content = failed ? (
    <span className="flex h-9 w-28 items-center justify-center rounded-lg border border-white/15 text-xs font-medium text-white/70 transition-[color,opacity] duration-300 motion-reduce:transition-none group-hover:text-accent-300 group-hover:opacity-100">
      {partenaire.nom}
    </span>
  ) : (
    <img
      src={`/images/partenaires/${partenaire.logo}`}
      alt={partenaire.nom}
      className="h-8 w-auto max-w-28 object-contain grayscale opacity-60 transition-[filter,opacity] duration-300 motion-reduce:transition-none group-hover:grayscale-0 group-hover:opacity-100 sm:h-9"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );

  if (partenaire.url) {
    return (
      <a
        href={partenaire.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={partenaire.nom}
        className="group flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5 motion-reduce:transition-none"
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className="group flex items-center justify-center p-2"
      aria-label={partenaire.nom}
    >
      {content}
    </span>
  );
}
