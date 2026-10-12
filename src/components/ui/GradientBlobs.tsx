/**
 * Nuages de dégradé décoratifs (indigo), en CSS pur — pas d'images à charger.
 * `absolute inset-0 overflow-hidden` sur le parent pour les contenir.
 */
export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-500/30 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary-300/25 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl" />
    </div>
  );
}
