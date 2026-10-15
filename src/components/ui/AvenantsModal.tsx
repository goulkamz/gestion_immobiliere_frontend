import { Download, Eye } from "lucide-react";
import type { DocumentAvenant } from "@/utils/avenants";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";

interface AvenantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  documents: DocumentAvenant[];
  isPending: (key: string) => boolean;
  onPreview: (doc: DocumentAvenant) => void;
  onDownload: (doc: DocumentAvenant) => void;
}

/** Liste des avenants d'un contrat, chacun avec aperçu et téléchargement du PDF. */
export function AvenantsModal({ isOpen, onClose, title, loading, documents, isPending, onPreview, onDownload }: AvenantsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} titleTone="indigo">
      {loading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : documents.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">Aucun avenant : le contrat n&apos;a pas été modifié depuis son émission.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <li key={doc.key} className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                {doc.icon}
                {doc.label}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  title="Aperçu"
                  aria-label={`Aperçu - ${doc.label}`}
                  disabled={isPending(doc.key)}
                  onClick={() => onPreview(doc)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eye size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Télécharger"
                  aria-label={`Télécharger - ${doc.label}`}
                  disabled={isPending(doc.key)}
                  onClick={() => onDownload(doc)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
