import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}

/** Barre de recherche pilule avec icône et bouton d'effacement, réutilisée sur les pages de liste. */
export function SearchInput({ value, onChange, placeholder, ariaLabel, className = "" }: SearchInputProps) {
  return (
    <div className={`relative w-full sm:w-72 ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-full border border-primary-100 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 shadow-sm transition-shadow placeholder:text-slate-400 focus:border-primary-300 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
