import type { ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-primary-50 text-primary-700",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${VARIANT_CLASSES[variant]}`}>
      {children}
    </span>
  );
}
