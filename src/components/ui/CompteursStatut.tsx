import { StatCard } from "./StatCard";
import type { StatCardTone } from "./StatCard";
import { List } from "lucide-react";
import type { CompteursStatut as Compteurs } from "@/hooks/useCompteursStatut";
import { DEFAULT_STATUT_ICON, STATUT_ICONS, statutLabel, statutToBadgeVariant } from "@/utils/statut";

const TONES: Record<string, StatCardTone> = { success: "success", danger: "danger", warning: "warning" };

interface CompteursStatutProps<S extends string> {
  compteurs: Compteurs<S>;
  statuts: readonly S[];
  /** Libellés propres à la page (sinon libellé standard du statut). */
  labels?: Partial<Record<S, string>>;
}

/** Rangée de cartes « Total + un compteur par statut » à placer au-dessus d'une liste. */
export function CompteursStatut<S extends string>({ compteurs, statuts, labels }: CompteursStatutProps<S>) {
  const valeur = (n: number) => (compteurs.loading ? "-" : n);
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
      <StatCard label="Total" value={valeur(compteurs.total)} icon={<List size={20} aria-hidden="true" />} tone="primary" />
      {statuts.map((s) => {
        const Icon = STATUT_ICONS[s] ?? DEFAULT_STATUT_ICON;
        return (
          <StatCard
            key={s}
            label={labels?.[s] ?? statutLabel(s)}
            value={valeur(compteurs.parStatut[s])}
            icon={<Icon size={20} aria-hidden="true" />}
            tone={TONES[statutToBadgeVariant(s)] ?? "primary"}
          />
        );
      })}
    </div>
  );
}
