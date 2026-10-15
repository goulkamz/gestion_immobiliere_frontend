import type { UseFormRegisterReturn } from "react-hook-form";
import { Info } from "lucide-react";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

interface AvenantFieldsProps {
  motif: UseFormRegisterReturn;
  accord: UseFormRegisterReturn;
  /** Absent pour un mandat : la modification s'applique le jour même. */
  dateEffet?: UseFormRegisterReturn;
  errors: { motif?: string; accord?: string; dateEffet?: string };
}

/**
 * Champs communs à la modification d'un contrat actif (location ou mandat) : motif, date d'effet et accord du client.
 * Ils alimentent l'avenant créé par le serveur ; le contrat d'origine reste inchangé.
 */
export function AvenantFields({ motif, accord, dateEffet, errors }: AvenantFieldsProps) {
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="flex items-start gap-2 text-sm text-amber-900">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Cette modification génère un avenant à faire signer par le client. Le contrat d&apos;origine reste inchangé.</span>
      </p>
      <Textarea
        label="Motif de la modification"
        required
        rows={2}
        placeholder="Ex. révision du loyer convenue avec le locataire"
        error={errors.motif}
        {...motif}
      />
      {dateEffet && (
        <Input
          label="Date d'effet"
          type="date"
          min={aujourdhui}
          helperText="Aujourd'hui par défaut. Une date passée est refusée."
          error={errors.dateEffet}
          {...dateEffet}
        />
      )}
      <div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" {...accord} />
          <span>Le client a été informé et a accepté cette modification</span>
        </label>
        {errors.accord && (
          <p role="alert" className="mt-1 text-xs text-danger-600">
            {errors.accord}
          </p>
        )}
      </div>
    </div>
  );
}
