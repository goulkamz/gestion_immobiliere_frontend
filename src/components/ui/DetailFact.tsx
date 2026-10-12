import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface DetailFactProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}

/** Fiche info compacte (icône ronde + libellé + valeur) pour les pages de détail bien/maison. */
export function DetailFact({ icon: Icon, label, value }: DetailFactProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary-100/60 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="truncate font-semibold text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
