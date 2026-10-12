import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  children: ReactNode;
  /** "indigo" : bandeau de titre fond indigo, texte or. Par défaut : sobre. */
  titleTone?: "plain" | "indigo";
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, size = "md", footer, closeOnOverlay = true, children, titleTone = "plain" }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? dialog)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div className="flex min-h-full items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${SIZE_CLASSES[size]} rounded-xl bg-white shadow-xl`}
      >
        <div
          className={`flex items-center justify-between px-5 py-4 ${
            titleTone === "indigo"
              ? "rounded-t-xl bg-linear-to-br from-primary-700 to-primary-900"
              : "border-b border-slate-100"
          }`}
        >
          {title && (
            <h2
              id={titleId}
              className={`font-heading text-lg font-semibold ${titleTone === "indigo" ? "text-accent-400" : "text-slate-900"}`}
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className={`ml-auto rounded-lg p-1.5 transition-colors ${
              titleTone === "indigo" ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
      </div>
    </div>
  );
}
