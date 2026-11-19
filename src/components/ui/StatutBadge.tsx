import { DEFAULT_STATUT_ICON, STATUT_ICONS, statutLabel, statutToBadgeVariant } from "@/utils/statut";
import { Badge } from "./Badge";

/** Badge de statut métier : icône + libellé humanisé, couleur cohérente (remplace l'affichage du code brut). */
export function StatutBadge({ statut, label }: { statut: string; label?: string }) {
  const Icon = STATUT_ICONS[statut] ?? DEFAULT_STATUT_ICON;
  return (
    <Badge variant={statutToBadgeVariant(statut)}>
      <Icon size={12} aria-hidden="true" />
      {label ?? statutLabel(statut)}
    </Badge>
  );
}
