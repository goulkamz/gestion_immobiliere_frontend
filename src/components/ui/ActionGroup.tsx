import type { ReactNode } from "react";

export interface ActionGroupItem {
  /** Libellé complet, utilisé pour l'accessibilité (aria-label / title). */
  label: string;
  /** Texte court affiché à côté de l'icône. Si omis, le bouton reste icône seule. */
  text?: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}

interface ActionGroupProps {
  items: ActionGroupItem[];
}

/** Groupe d'actions compact pour une ligne de tableau — icônes (+ texte court) segmentées dans un même conteneur. */
export function ActionGroup({ items }: ActionGroupProps) {
  if (items.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-primary-100 bg-primary-50/60 p-0.5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          title={item.label}
          aria-label={item.label}
          disabled={item.disabled}
          onClick={item.onClick}
          className={`flex h-6 items-center justify-center gap-1 rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            item.text ? "px-1.5" : "w-6"
          } ${
            item.tone === "danger"
              ? "text-danger-600 hover:bg-white hover:shadow-sm"
              : "text-primary-700 hover:bg-white hover:shadow-sm"
          }`}
        >
          {item.icon}
          {item.text && <span className="text-xs font-medium whitespace-nowrap">{item.text}</span>}
        </button>
      ))}
    </div>
  );
}
