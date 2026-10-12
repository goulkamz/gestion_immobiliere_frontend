import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, icon, fullWidth = true, id, required, className = "", type, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          required={required}
          aria-invalid={!!error}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
            icon ? "pl-10" : ""
          } ${isPassword ? "pr-10" : ""} ${
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-200"
              : "border-slate-300 focus:border-primary-500 focus:ring-primary-200"
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition-colors hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="mt-1.5 text-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});
