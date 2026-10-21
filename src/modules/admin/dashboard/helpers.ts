export const PALETTE = [
  "var(--color-primary-600)",
  "var(--color-accent-500)",
  "var(--color-success-600)",
  "var(--color-warning-600)",
  "var(--color-danger-600)",
  "var(--color-primary-400)",
];

export const STATUT_COLORS: Record<string, string> = {
  DISPONIBLE: "var(--color-success-600)",
  LOUEE: "var(--color-primary-600)",
  RESERVEE: "var(--color-warning-600)",
  EN_MAINTENANCE: "var(--color-danger-600)",
};

export const TOOLTIP_STYLE = { borderRadius: 12, border: "1px solid var(--color-primary-100)", fontSize: 13 };

export interface Slice {
  name: string;
  value: number;
  color: string;
}

export function toSlices(map: Record<string, number> | undefined, label: (k: string) => string, colors?: Record<string, string>): Slice[] {
  return Object.entries(map ?? {}).map(([k, value], i) => ({
    name: label(k),
    value,
    color: colors?.[k] ?? PALETTE[i % PALETTE.length]!,
  }));
}

/** Axe des montants compact : 1 500 000 devient « 1,5 M ». */
export function montantCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)} k`;
  return String(v);
}

export function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m.charAt(0).toUpperCase())
    .join("");
}

/** Couleur d'un taux de recouvrement : rouge sous 50 %, orange jusqu'à 80 %, vert au-delà. */
export function couleurTaux(taux: number): string {
  if (taux >= 80) return "var(--color-success-600)";
  if (taux >= 50) return "var(--color-warning-600)";
  return "var(--color-danger-600)";
}

/** Parts de tarte : indigo foncé et or en alternance, texte clair sur fond foncé et foncé sur fond clair. */
export const COULEURS_PARTS: { color: string; text: string }[] = [
  { color: "var(--color-primary-800)", text: "#ffffff" },
  { color: "var(--color-accent-500)", text: "var(--color-primary-950)" },
  { color: "var(--color-primary-500)", text: "#ffffff" },
  { color: "var(--color-accent-300)", text: "var(--color-primary-950)" },
  { color: "var(--color-primary-300)", text: "var(--color-primary-950)" },
];
