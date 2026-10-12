import type { TemoignageRole } from "@/api/types";

const ROLE_LABELS: Record<TemoignageRole, string> = {
  PROPRIETAIRE: "Propriétaire",
  LOCATAIRE: "Locataire",
  AGENCE: "Équipe de l'agence",
  AUTRE: "Client",
};

export function temoignageRoleLabel(role: TemoignageRole): string {
  return ROLE_LABELS[role];
}

/** Initiales à partir d'un nom complet ("Fatou Ouédraogo" → "FO"), pour l'avatar par défaut. */
export function initialsFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last ?? ""}`.toUpperCase() || "?";
}
