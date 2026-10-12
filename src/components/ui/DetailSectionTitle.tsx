import { FileText } from "lucide-react";

/** Titre de section pour les pages de détail public (ex. "Description") : icône + trait or, cohérent avec SectionHeader/FooterHeading. */
export function DetailSectionTitle({ children }: { children: string }) {
  return (
    <div className="mt-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
        <FileText size={18} className="text-primary-600" aria-hidden="true" />
        {children}
      </h2>
      <span className="mt-1.5 block h-0.5 w-10 rounded-full bg-accent-400" aria-hidden="true" />
    </div>
  );
}
