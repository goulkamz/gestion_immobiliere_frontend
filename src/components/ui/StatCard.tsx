import type { ReactNode } from "react";

export type StatCardTone = "primary" | "accent" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: StatCardTone;
}

const TONE_CLASSES: Record<StatCardTone, string> = {
  primary: "bg-primary-600",
  accent: "bg-accent-500",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
};

/** Carte statistique façon tableau de bord : badge d'icône circulaire plein, valeur en avant, libellé discret en dessous. */
export function StatCard({ label, value, icon, tone = "primary" }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-primary-100/60 bg-white p-5 shadow-sm">
      {icon && (
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${TONE_CLASSES[tone]}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
