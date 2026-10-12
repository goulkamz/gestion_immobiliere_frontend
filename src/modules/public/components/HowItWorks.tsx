import type { LucideIcon } from "lucide-react";

export interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: HowItWorksStep[];
}

const ACCENTS = [
  { border: "border-primary-600", badge: "bg-primary-600", ghost: "text-primary-50" },
  { border: "border-accent-500", badge: "bg-accent-500", ghost: "text-accent-50" },
  { border: "border-primary-600", badge: "bg-primary-600", ghost: "text-primary-50" },
  { border: "border-accent-500", badge: "bg-accent-500", ghost: "text-accent-50" },
];

/** Étapes "Comment ça marche" : cartes à bordure colorée avec un grand numéro fantôme en filigrane. */
export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => {
        const accent = ACCENTS[i % ACCENTS.length]!;
        return (
          <div
            key={step.title}
            className={`relative overflow-hidden rounded-2xl border-t-4 bg-white p-6 shadow-sm ${accent.border}`}
          >
            <span
              className={`pointer-events-none absolute -right-2 -top-6 font-heading text-8xl font-black leading-none ${accent.ghost}`}
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-white ${accent.badge}`}>
              <step.icon size={22} aria-hidden="true" />
            </span>
            <h3 className="relative mt-4 font-heading font-semibold text-slate-900">{step.title}</h3>
            <p className="relative mt-1.5 text-sm text-slate-500">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}
