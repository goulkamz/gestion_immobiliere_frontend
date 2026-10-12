import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { SelectOption } from "./Select";

export interface RemoteComboboxResult {
  options: SelectOption[];
  /** Nombre total de résultats côté serveur (pour signaler que la liste est tronquée). */
  total?: number;
  isFetching?: boolean;
}

interface RemoteComboboxProps {
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  id?: string;
  /** Fournis par `register` de react-hook-form : le composant les appelle avec la valeur choisie. */
  name?: string;
  onChange?: (event: { target: HTMLInputElement; type: string }) => unknown;
  onBlur?: (event: { target: HTMLInputElement; type: string }) => unknown;
  /**
   * Hook de la page : reçoit le texte saisi (différé de 300 ms) et renvoie les premiers résultats du serveur.
   * Doit toujours être la même fonction d'un rendu à l'autre (c'est un hook).
   */
  useOptions: (recherche: string) => RemoteComboboxResult;
  /**
   * Valeur courante du formulaire (ex. `watch("idClient")`). Sert uniquement à vider l'affichage quand
   * le formulaire est réinitialisé : la valeur envoyée reste celle du champ caché.
   */
  value?: unknown;
  emptyText?: string;
  /**
   * Élément déjà choisi à l'ouverture (mode édition) : affiché sans attendre les résultats de la recherche.
   * Lu au montage seulement ; changer de `key` pour le renouveler.
   */
  initialOption?: SelectOption;
}

/**
 * Sélection avec recherche côté serveur, à la place d'un `<select>` rempli par une liste plafonnée.
 * Un champ caché porte la valeur sous `name`, avec la `ref` transmise : le composant reste donc
 * compatible avec `{...register("champ")}` sans `Controller`. L'élément choisi est mémorisé ici,
 * il reste affiché même s'il n'est plus dans les résultats de la recherche en cours.
 */
export const RemoteCombobox = forwardRef<HTMLInputElement, RemoteComboboxProps>(function RemoteCombobox(
  {
    label,
    required,
    error,
    placeholder = "Rechercher…",
    id,
    name,
    onChange,
    onBlur,
    useOptions,
    value,
    emptyText = "Aucun résultat",
    initialOption,
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-liste`;
  const errorId = error ? `${inputId}-error` : undefined;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement | null>(null);

  const [selected, setSelected] = useState<SelectOption | null>(initialOption ?? null);
  const [ouvert, setOuvert] = useState(false);
  const [enSaisie, setEnSaisie] = useState(false);
  const [actif, setActif] = useState(0);
  const { search, setSearch, recherche } = useRechercheServeur();

  const { options, total, isFetching } = useOptions(recherche);

  const setHiddenRef = useCallback(
    (node: HTMLInputElement | null) => {
      hiddenRef.current = node;
      if (node) {
        // Quand react-hook-form veut mettre le focus sur le champ en erreur, on le donne à la saisie visible
        node.focus = () => inputRef.current?.focus();
      }
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Réinitialisation du formulaire : la valeur repasse à vide, on oublie l'élément affiché
  const valeurPrecedente = useRef(value);
  useEffect(() => {
    const avant = valeurPrecedente.current;
    valeurPrecedente.current = value;
    const estVide = value === undefined || value === null || value === "" || value === 0;
    const etaitRempli = avant !== undefined && avant !== null && avant !== "" && avant !== 0;
    if (estVide && etaitRempli) {
      setSelected(null);
      setEnSaisie(false);
      setSearch("");
    }
  }, [value, setSearch]);

  const fermer = useCallback(() => {
    setOuvert(false);
    setEnSaisie(false);
    setSearch("");
  }, [setSearch]);

  function choisir(option: SelectOption | null) {
    const hidden = hiddenRef.current;
    setSelected(option);
    if (hidden) {
      hidden.value = option ? String(option.value) : "";
      onChange?.({ target: hidden, type: "change" });
    }
    fermer();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!ouvert) setOuvert(true);
        else setActif((i) => (options.length ? (i + 1) % options.length : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!ouvert) setOuvert(true);
        else setActif((i) => (options.length ? (i - 1 + options.length) % options.length : 0));
        break;
      case "Enter":
        // Évite l'envoi du formulaire tant que la liste est ouverte
        if (ouvert) {
          e.preventDefault();
          if (options[actif]) choisir(options[actif]);
        }
        break;
      case "Escape":
        if (ouvert) {
          // Ne ferme que la liste, pas la fenêtre qui contient le formulaire
          e.preventDefault();
          e.stopPropagation();
          fermer();
        }
        break;
      case "Tab":
        fermer();
        break;
    }
  }

  function onFocusOut(e: FocusEvent<HTMLDivElement>) {
    if (wrapperRef.current?.contains(e.relatedTarget as Node | null)) return;
    fermer();
    if (hiddenRef.current) onBlur?.({ target: hiddenRef.current, type: "blur" });
  }

  const tronque = total !== undefined && total > options.length;
  const indexActif = Math.min(actif, Math.max(options.length - 1, 0));
  const texteAffiche = enSaisie ? search : (selected?.label ?? "");

  return (
    <div className="w-full" ref={wrapperRef} onBlur={onFocusOut}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {/* Pas de defaultValue : React le réapplique à chaque rendu et écraserait la valeur posée par choisir() */}
        <input type="hidden" name={name} ref={setHiddenRef} />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={ouvert}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={ouvert && options[indexActif] ? `${inputId}-opt-${indexActif}` : undefined}
          aria-invalid={!!error}
          aria-describedby={errorId}
          aria-required={required}
          placeholder={placeholder}
          value={texteAffiche}
          onChange={(e) => {
            setEnSaisie(true);
            setSearch(e.target.value);
            setActif(0);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onClick={() => setOuvert(true)}
          onKeyDown={onKeyDown}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-200"
              : "border-slate-300 focus:border-primary-500 focus:ring-primary-200"
          }`}
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
          {isFetching && <Loader2 size={14} className="animate-spin text-slate-400" aria-hidden="true" />}
          {selected && (
            <button
              type="button"
              onClick={() => {
                choisir(null);
                inputRef.current?.focus();
              }}
              aria-label="Effacer la sélection"
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={16} className="pointer-events-none text-slate-400" aria-hidden="true" />
        </div>

        {ouvert && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
          >
            {options.map((option, i) => (
              <li
                key={option.value}
                id={`${inputId}-opt-${i}`}
                role="option"
                aria-selected={selected?.value === option.value}
                // mouseDown plutôt que click : la saisie ne doit pas perdre le focus avant le choix
                onMouseDown={(e) => {
                  e.preventDefault();
                  choisir(option);
                }}
                onMouseEnter={() => setActif(i)}
                className={`cursor-pointer px-3.5 py-2 ${
                  i === indexActif ? "bg-primary-50 text-primary-900" : "text-slate-800"
                } ${selected?.value === option.value ? "font-semibold" : ""}`}
              >
                {option.label}
              </li>
            ))}
            {options.length === 0 && !isFetching && (
              <li role="presentation" className="px-3.5 py-2 text-slate-500">
                {emptyText}
              </li>
            )}
            {tronque && (
              <li role="presentation" className="border-t border-slate-100 px-3.5 py-2 text-xs text-slate-500">
                {options.length} premiers résultats sur {total} - précisez la recherche
              </li>
            )}
          </ul>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {ouvert && !isFetching ? (options.length === 0 ? emptyText : `${total ?? options.length} résultats`) : ""}
      </p>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
