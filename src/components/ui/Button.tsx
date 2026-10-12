import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/25 focus-visible:outline-primary-600",
  accent: "bg-accent-500 text-white shadow-sm shadow-accent-600/20 hover:bg-accent-600 hover:shadow-md hover:shadow-accent-600/25 focus-visible:outline-accent-600",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:outline-slate-400",
  outline: "border border-primary-200 text-primary-700 hover:border-primary-300 hover:bg-primary-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-danger-600 text-white shadow-sm shadow-danger-600/20 hover:bg-danger-700 hover:shadow-md hover:shadow-danger-600/25 focus-visible:outline-danger-600",
  success: "bg-success-600 text-white shadow-sm shadow-success-600/20 hover:bg-success-700 hover:shadow-md hover:shadow-success-600/25 focus-visible:outline-success-600",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "left",
    fullWidth = false,
    disabled,
    children,
    className = "",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : 16} aria-hidden="true" />
      ) : (
        icon && iconPosition === "left" && icon
      )}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </button>
  );
});
