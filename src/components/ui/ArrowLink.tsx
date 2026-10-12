import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface ArrowLinkProps {
  to: string;
  children: ReactNode;
  /** "forward" (icône à droite) ou "back" (icône à gauche). */
  direction?: "forward" | "back";
  className?: string;
}

/**
 * Lien "pastille" bien visible : fond teinté au repos, bascule en plein
 * indigo au survol (icône dans un médaillon, pas de soulignement).
 */
export function ArrowLink({ to, children, direction = "forward", className = "" }: ArrowLinkProps) {
  const Icon = direction === "back" ? ArrowLeft : ArrowRight;
  const iconBadge = (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-colors group-hover:bg-white/25 group-hover:text-white">
      <Icon
        size={12}
        className={`transition-transform duration-200 ${direction === "back" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`}
        aria-hidden="true"
      />
    </span>
  );

  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full bg-primary-50 py-1.5 text-sm font-semibold text-primary-700 shadow-sm shadow-primary-900/0 transition-all duration-200 hover:bg-primary-600 hover:text-white hover:shadow-md hover:shadow-primary-600/30 ${direction === "back" ? "pl-1.5 pr-3.5" : "pl-3.5 pr-1.5"} ${className}`}
    >
      {direction === "back" && iconBadge}
      {children}
      {direction === "forward" && iconBadge}
    </Link>
  );
}
