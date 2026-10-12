import { toast } from "react-toastify";
import { AlertTriangle, Info } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { useCreateReservationMutation } from "@/hooks/queries/useReservations";
import { useParametresPubliquesQuery } from "@/hooks/queries/usePublicCatalog";
import { getParametreEntier } from "@/utils/parametres";
import { dateDebutMaintenant } from "@/utils/dateDebut";
import { formatDateTime } from "@/utils/format";
import { ApiError } from "@/api/http";
import type { MaisonResponse } from "@/api/types";

interface ReserveMaisonModalProps {
  maison: MaisonResponse | null;
  onClose: () => void;
}

/** Modal de confirmation de réservation d'une maison, réutilisée sur la page de détail et les cartes catalogue/accueil. */
export function ReserveMaisonModal({ maison, onClose }: ReserveMaisonModalProps) {
  const parametresQuery = useParametresPubliquesQuery();
  const delaiExpirationHeures = getParametreEntier(parametresQuery.data, "DELAI_EXPIRATION_RESERVATION_HEURES", 6);
  const createMutation = useCreateReservationMutation();

  async function handleConfirm() {
    if (!maison) return;
    try {
      const response = await createMutation.mutateAsync({ idMaison: maison.idMaison, dateDebut: dateDebutMaintenant() });
      toast.success(
        `Réservation envoyée à l'agence. Sans confirmation avant ${formatDateTime(response.dateFin)}, elle expirera automatiquement.`,
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Réservation impossible.");
    }
  }

  const title = maison ? (maison.nomCommunMaison ?? `Maison #${maison.idMaison}`) : "";

  return (
    <Modal isOpen={maison !== null} onClose={onClose} title="Confirmer la réservation" titleTone="indigo">
      {maison && (
        <>
          <p className="text-sm text-slate-600">
            Vous êtes sur le point de réserver <strong>{title}</strong>.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Dès l&apos;envoi, cette réservation bloque la maison pendant {delaiExpirationHeures} heures, le temps que
              l&apos;agence vous contacte pour finaliser le dossier. Si vous savez que vous ne serez pas joignable dans les{" "}
              {delaiExpirationHeures} prochaines heures, mieux vaut attendre avant de réserver.
            </span>
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-primary-50 p-3 text-xs text-primary-700">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Si l&apos;agence ne la confirme pas à temps, elle expire automatiquement et la maison redevient disponible.
          </p>
          <Button fullWidth size="lg" className="mt-4" loading={createMutation.isPending} onClick={handleConfirm}>
            Confirmer la réservation
          </Button>
        </>
      )}
    </Modal>
  );
}
