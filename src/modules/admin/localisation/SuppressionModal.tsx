import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "@/components/ui";

interface SuppressionModalProps {
  /** Libellé de l'élément à supprimer ; null = fenêtre fermée. */
  nom: string | null;
  titre: string;
  /** Avertissement affiché sous la phrase de confirmation (ex. ce qui bloque la suppression). */
  precision?: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function SuppressionModal({ nom, titre, precision, loading, onConfirm, onClose }: SuppressionModalProps) {
  return (
    <Modal isOpen={nom !== null} onClose={onClose} title={titre} titleTone="indigo">
      <p className="text-sm text-slate-600">
        Vous êtes sur le point de supprimer <strong>{nom}</strong>.
      </p>
      {precision && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{precision}</p>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="danger" className="flex-1" loading={loading} onClick={onConfirm}>
          Supprimer
        </Button>
      </div>
    </Modal>
  );
}
