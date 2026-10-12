import { useEffect, useMemo } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  blob: Blob | null;
  onDownload: () => void;
}

/**
 * Aperçu de document PDF intégré à la plateforme (iframe), avec téléchargement à la demande.
 * Certains navigateurs mobiles (Safari/iOS notamment) n'affichent pas toujours un PDF en blob
 * dans une iframe : un lien de secours "nouvel onglet" est donc toujours proposé.
 */
export function DocumentPreviewModal({ isOpen, onClose, title, blob, onDownload }: DocumentPreviewModalProps) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <Button variant="outline" icon={<Download size={16} />} onClick={onDownload}>
          Télécharger
        </Button>
      }
    >
      {url && (
        <>
          <iframe src={url} title={title} className="h-[70vh] w-full rounded-lg border border-slate-200" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            <ExternalLink size={13} aria-hidden="true" />
            L&apos;aperçu ne s&apos;affiche pas ? Ouvrir dans un nouvel onglet
          </a>
        </>
      )}
    </Modal>
  );
}
