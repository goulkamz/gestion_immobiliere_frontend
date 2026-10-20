import { DUREES_EVOLUTION } from "./useSerieEvolution";

/** Choix de la durée affichée (6, 12 ou 24 mois). */
export function SelecteurDuree({ valeur, onChange }: { valeur: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Durée affichée">
      {DUREES_EVOLUTION.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={valeur === n}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            valeur === n ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-primary-50"
          }`}
        >
          {n} mois
        </button>
      ))}
    </div>
  );
}
