import type { LucideIcon } from "lucide-react";

export interface StatItem {
  icon: LucideIcon;
  label: string;
  value: number;
  /** Volontairement limité à 2 tons (charte indigo/or), pas une couleur différente par carte. */
  tone: "primary" | "accent";
}

interface StatsBannerProps {
  items: StatItem[];
}

const TONE_CLASSES: Record<StatItem["tone"], { bar: string; icon: string }> = {
  primary: { bar: "bg-primary-600", icon: "bg-primary-50 text-primary-600" },
  accent: { bar: "bg-accent-500", icon: "bg-accent-50 text-accent-600" },
};

/** Statistiques clés : cartes indépendantes flottantes, chevauchant le bas du hero (pas un bloc unique), 2 tons alternés. */
export function StatsBanner({ items }: StatsBannerProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {items.map((item) => {
        const tone = TONE_CLASSES[item.tone];
        return (
          <div
            key={item.label}
            className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-1"
          >
            <div className={`h-1.5 rounded-t-2xl ${tone.bar}`} />
            <div className="flex items-center gap-4 p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                <item.icon size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading text-2xl font-bold text-slate-900">{item.value.toLocaleString("fr-FR")}</p>
                <p className="text-sm text-slate-500">{item.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
