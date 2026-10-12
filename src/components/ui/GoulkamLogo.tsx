interface GoulkamLogoProps {
  /** Ordre des couleurs de gauche à droite. */
  order?: "blanc-noir" | "noir-blanc";
  /** Proportion occupée par la première couleur (0-1). */
  ratio?: number;
  width?: number;
  height?: number;
  /** Couleur du contour extérieur ; à adapter selon le fond sur lequel le logo est posé. */
  contourColor?: string;
  className?: string;
}

/**
 * Marque GOULKAM CONSULTING : un trait horizontal scindé verticalement en
 * deux blocs de couleur inégaux (blanc / noir), angles droits (pas
 * d'arrondi). Un seul contour extérieur (pas de trait entre les deux
 * couleurs).
 */
export function GoulkamLogo({
  order = "blanc-noir",
  ratio = 0.65,
  width = 80,
  height = 14,
  contourColor = "#ffffff",
  className = "",
}: GoulkamLogoProps) {
  const firstColor = order === "blanc-noir" ? "#ffffff" : "#0f172a";
  const secondColor = order === "blanc-noir" ? "#0f172a" : "#ffffff";
  const firstWidth = width * ratio;
  const secondWidth = width - firstWidth;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Logo GOULKAM CONSULTING"
      className={`shrink-0 ${className}`}
    >
      <rect x={0} y={0} width={firstWidth} height={height} fill={firstColor} />
      <rect x={firstWidth} y={0} width={secondWidth} height={height} fill={secondColor} />
      <rect x={0.5} y={0.5} width={width - 1} height={height - 1} fill="none" stroke={contourColor} strokeWidth={1} />
    </svg>
  );
}
