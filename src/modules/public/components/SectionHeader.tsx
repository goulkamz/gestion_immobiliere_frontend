import { ArrowLink } from "@/components/ui";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  action?: { label: string; to: string };
}

/** En-tête de section homogène (kicker + titre + description + lien optionnel), pour un rythme visuel cohérent d'une section à l'autre. */
export function SectionHeader({ kicker, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">{kicker}</p>
        <h2 className="mt-1 font-heading text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <ArrowLink to={action.to}>{action.label}</ArrowLink>}
    </div>
  );
}
