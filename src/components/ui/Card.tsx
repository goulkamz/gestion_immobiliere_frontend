import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, subtitle, icon, footer, hoverable, clickable, onClick, className = "", children }: CardProps) {
  const Component = clickable ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      type={clickable ? "button" : undefined}
      className={`w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow ${
        hoverable || clickable ? "hover:shadow-md" : ""
      } ${className}`}
    >
      {(title || icon) && (
        <div className="mb-3 flex items-start gap-3">
          {icon && <span className="text-primary-600">{icon}</span>}
          <div>
            {title && <h3 className="font-heading text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
      {footer && <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div>}
    </Component>
  );
}
