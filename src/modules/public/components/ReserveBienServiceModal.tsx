import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Button, Input, Modal } from "@/components/ui";
import { useCreateLocationMutation } from "@/hooks/queries/useLocations";
import { locationDatesSchema, type LocationDatesFormInput, type LocationDatesFormValues } from "@/modules/client/schemas";
import { ApiError } from "@/api/http";
import type { BienServiceResponse } from "@/api/types";

interface ReserveBienServiceModalProps {
  bien: BienServiceResponse | null;
  onClose: () => void;
}

/** Formulaire de demande de location (dates) d'un bien/service, réutilisé sur la page de détail et les cartes catalogue/accueil. */
export function ReserveBienServiceModal({ bien, onClose }: ReserveBienServiceModalProps) {
  const createMutation = useCreateLocationMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationDatesFormInput, unknown, LocationDatesFormValues>({ resolver: zodResolver(locationDatesSchema) });

  async function onSubmit(values: LocationDatesFormValues) {
    if (!bien) return;
    try {
      await createMutation.mutateAsync({
        idBienService: bien.idBienService,
        destination: values.destination,
        dateDebut: `${values.dateDebut}T00:00:00`,
        dateFin: `${values.dateFin}T00:00:00`,
      });
      toast.success("Demande de location envoyée à l'agence.");
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Demande impossible.");
    }
  }

  return (
    <Modal isOpen={bien !== null} onClose={onClose} title={bien ? `Réserver - ${bien.libelle}` : "Réserver"} titleTone="indigo">
      {bien && (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Destination / usage" {...register("destination")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date de début" type="date" required error={errors.dateDebut?.message} {...register("dateDebut")} />
            <Input label="Date de fin" type="date" required error={errors.dateFin?.message} {...register("dateFin")} />
          </div>
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Envoyer la demande
          </Button>
        </form>
      )}
    </Modal>
  );
}
