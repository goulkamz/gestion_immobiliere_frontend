import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** "indigo" : bandeau plein fond indigo avec sous-titre or en gras (espace client). Par défaut : sobre, fond transparent. */
  tone?: "plain" | "indigo";
}

export function PageHeader({ title, description, actions, tone = "plain" }: PageHeaderProps) {
  if (tone === "indigo") {
    return (
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-linear-to-br from-primary-700 to-primary-900 px-5 py-4 sm:px-6 sm:py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{title}</h1>
          {description && <p className="mt-1 text-sm font-bold text-accent-400">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
