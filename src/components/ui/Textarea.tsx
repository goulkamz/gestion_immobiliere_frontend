import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, id, required, className = "", rows = 4, ...rest },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          error
            ? "border-danger-500 focus:border-danger-500 focus:ring-danger-200"
            : "border-slate-300 focus:border-primary-500 focus:ring-primary-200"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>}
    </div>
  );
});
