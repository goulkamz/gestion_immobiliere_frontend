import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, id, required, className = "", ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-200"
              : "border-slate-300 focus:border-primary-500 focus:ring-primary-200"
          } ${className}`}
          {...rest}
        >
          {placeholder && (
            // Pas de `hidden` : pour un filtre non obligatoire, cette option doit rester
            // sélectionnable dans la liste même après avoir choisi une autre valeur (sinon
            // impossible de revenir à « Tous… »). Pour un champ obligatoire, `disabled`
            // suffit à empêcher de la resélectionner comme valeur valide.
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute inset-y-0 right-3 my-auto text-slate-400"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
