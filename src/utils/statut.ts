import { AlertTriangle, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeVariant } from "@/components/ui/Badge";

/** Mappe les statuts métier les plus courants vers une variante de badge cohérente. */
export function statutToBadgeVariant(statut: string): BadgeVariant {
  const positifs = ["ACTIVE", "ACTIF", "DISPONIBLE", "CONFIRMEE", "PAYE", "TRAITE", "TRAITEE", "SATISFAITE", "PRET", "REGLE", "CONVERTIE", "LU", "PUBLIE"];
  const negatifs = ["EXPIREE", "EXPIRE", "SUSPENDUE", "ANNULE", "ANNULEE", "RESILIE", "EN_MAINTENANCE", "EN_RETARD", "ECHEC", "RETIRE", "REFUSEE"];
  const attente = ["EN_ATTENTE", "NON_LU", "EN_COURS", "RESERVEE"];
  if (positifs.includes(statut)) return "success";
  if (negatifs.includes(statut)) return "danger";
  if (attente.includes(statut)) return "warning";
  return "neutral";
}

export const STATUT_ICONS: Record<string, LucideIcon> = {
  ACTIVE: CheckCircle2,
  ACTIF: CheckCircle2,
  DISPONIBLE: CheckCircle2,
  CONFIRMEE: CheckCircle2,
  PAYE: CheckCircle2,
  TRAITE: CheckCircle2,
  SATISFAITE: CheckCircle2,
  PRET: CheckCircle2,
  REGLE: CheckCircle2,
  CONVERTIE: CheckCircle2,
  LU: CheckCircle2,
  TERMINE: CheckCircle2,
  PUBLIE: CheckCircle2,
  TRAITEE: CheckCircle2,
  EXPIREE: XCircle,
  EXPIRE: XCircle,
  SUSPENDUE: XCircle,
  ANNULE: XCircle,
  ANNULEE: XCircle,
  RESILIE: XCircle,
  ECHEC: XCircle,
  RETIRE: XCircle,
  REFUSEE: XCircle,
  EN_MAINTENANCE: AlertTriangle,
  EN_RETARD: AlertTriangle,
  EN_ATTENTE: Clock,
  EN_COURS: Clock,
  NON_LU: Clock,
  RESERVEE: Clock,
};

/** Icône de repli quand le statut n'a pas d'icône dédiée dans `STATUT_ICONS`. */
export const DEFAULT_STATUT_ICON: LucideIcon = Circle;

const LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  ANNULEE: "Annulée",
  ANNULE: "Annulée",
  CONVERTIE: "Convertie",
  ACTIF: "Actif",
  ACTIVE: "Active",
  TERMINE: "Terminé",
  RESILIE: "Résilié",
  EXPIRE: "Expiré",
  PAYE: "Payée",
  EN_RETARD: "En retard",
  DISPONIBLE: "Disponible",
  RESERVEE: "Réservée",
  LOUEE: "Louée",
  EN_MAINTENANCE: "En maintenance",
  EXPIREE: "Expirée",
  SUSPENDUE: "Suspendue",
  EN_COURS: "En cours",
  SATISFAITE: "Satisfaite",
  NON_LU: "Non lu",
  LU: "Lu",
  TRAITE: "Traité",
  TRAITEE: "Traitée",
  REFUSEE: "Refusée",
  PUBLIE: "Publié",
  RETIRE: "Retiré",
};

/** Libellé humanisé (français) d'un statut backend, avec repli sur une version espacée/capitalisée. */
export function statutLabel(statut: string): string {
  if (LABELS[statut]) return LABELS[statut];
  const words = statut.toLowerCase().split("_");
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
