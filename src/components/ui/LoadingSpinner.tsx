import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 32, text, fullScreen = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <Loader2 className="animate-spin text-primary-600" size={size} aria-hidden="true" />
      {text && <p className="text-sm text-slate-600">{text}</p>}
      <span className="sr-only">{text ?? "Chargement en cours"}</span>
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">{content}</div>;
  }
  return <div className="flex min-h-[40vh] items-center justify-center">{content}</div>;
}
