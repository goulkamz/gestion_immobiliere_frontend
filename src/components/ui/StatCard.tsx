import type { ReactNode } from "react";

export type StatCardTone = "primary" | "accent" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: StatCardTone;
  /** Précision sous le libellé (date, nombre de maisons...), qui passe à la ligne au lieu d'être coupée. */
  detail?: string;
  /** Carte resserrée pour les rangées de 4 ou 5 : marges et pastille réduites, libellé qui passe à la ligne au lieu d'être coupé. */
  compact?: boolean;
}

const TONE_CLASSES: Record<StatCardTone, string> = {
  primary: "bg-primary-600",
  accent: "bg-accent-500",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
};

/** Carte statistique façon tableau de bord : badge d'icône circulaire plein, valeur en avant, libellé discret en dessous. */
export function StatCard({ label, value, icon, tone = "primary", detail, compact = false }: StatCardProps) {
  return (
    <div className={`flex items-center rounded-2xl border border-primary-100/60 bg-white shadow-sm ${compact ? "gap-3 p-4" : "gap-4 p-5"}`}>
      {icon && (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full text-white ${compact ? "h-10 w-10" : "h-12 w-12"} ${TONE_CLASSES[tone]}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className={`font-heading font-bold text-slate-900 ${String(value).length > 10 ? "text-xl" : "text-2xl"}`}>{value}</p>
        <p className={`text-xs text-slate-500 ${compact ? "leading-tight" : "truncate"}`}>{label}</p>
        {detail && <p className="text-xs font-medium text-accent-700">{detail}</p>}
      </div>
    </div>
  );
}
