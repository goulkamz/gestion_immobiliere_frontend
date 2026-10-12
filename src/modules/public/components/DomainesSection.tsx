import { DOMAINES } from "../data/domaines";
import { DomaineCard } from "./DomaineCard";

/**
 * Section vitrine "Nos domaines d'intervention" : présente les services
 * réellement proposés par l'agence (catalogue, mandats, annonces, demandes,
 * suivi documentaire) pour donner envie de confier un bien ou de passer à
 * l'action. Le domaine marqué `phare` dans data/domaines.ts est mis en avant
 * en grande carte, les autres suivent en grille.
 */
export function DomainesSection() {
  const phare = DOMAINES.find((d) => d.phare);
  const autres = DOMAINES.filter((d) => !d.phare);

  return (
    <section
      className="relative mt-8 overflow-hidden rounded-3xl bg-linear-to-b from-primary-50/70 via-white to-white p-6 shadow-sm ring-1 ring-primary-100/60 sm:p-8"
      aria-labelledby="domaines-title"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-200/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" aria-hidden="true" />

      <div className="relative mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">Nos services</p>
        <h2 id="domaines-title" className="mt-1 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          Nos domaines d'intervention
        </h2>
        <span className="mx-auto mt-3 block h-1 w-14 rounded-full bg-linear-to-r from-primary-600 to-primary-300" aria-hidden="true" />
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
          De la recherche d'un logement à la gestion complète de votre patrimoine, GestImmo vous accompagne à
          chaque étape avec rigueur et transparence.
        </p>
      </div>

      <div className="relative space-y-6">
        {phare && <DomaineCard domaine={phare} phare />}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {autres.map((domaine, index) => (
            <DomaineCard key={domaine.id} domaine={domaine} delayMs={index * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
