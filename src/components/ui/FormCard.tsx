import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface FormCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  /** "indigo" : bandeau fond indigo sous le titre (titre en or, description claire). Par défaut : sobre. */
  tone?: "plain" | "indigo";
}

/** Carte de formulaire standard : barre d'accent ou bandeau indigo, icône + titre centrés, pied de carte optionnel. */
export function FormCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-md",
  tone = "plain",
}: FormCardProps) {
  return (
    <div className={`mx-auto w-full ${maxWidthClassName} overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/5`}>
      {tone === "indigo" ? (
        <div className="bg-linear-to-br from-primary-700 to-primary-900 px-8 py-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-accent-400">
            <Icon size={26} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-center font-heading text-2xl font-bold text-accent-400">{title}</h1>
          {description && <p className="mt-1.5 text-center text-sm text-primary-100">{description}</p>}
        </div>
      ) : (
        <>
          <div className="h-1.5 bg-linear-to-r from-primary-700 via-primary-500 to-primary-300" />
          <div className="px-8 pt-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Icon size={26} aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-center font-heading text-2xl font-bold text-slate-900">{title}</h1>
            {description && <p className="mt-1.5 text-center text-sm text-slate-500">{description}</p>}
          </div>
        </>
      )}
      <div className={tone === "indigo" ? "px-8 py-6" : "px-8 pb-8"}>{children}</div>
      {footer && <div className="border-t border-slate-100 bg-slate-50/70 px-8 py-4 text-center text-sm text-slate-500">{footer}</div>}
    </div>
  );
}
