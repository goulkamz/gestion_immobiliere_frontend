import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Button, Input, PhotoPicker, Textarea } from "@/components/ui";
import { offreSchema, type OffreFormValues } from "../schemas";
import { usePostOffreMutation } from "@/hooks/queries/usePublicCatalog";
import { publicApi } from "@/api/public";
import { ApiError } from "@/api/http";

export function OffreForm() {
  const mutation = usePostOffreMutation();
  const [photos, setPhotos] = useState<File[]>([]);
  const [envoiPhotos, setEnvoiPhotos] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OffreFormValues>({ resolver: zodResolver(offreSchema) });

  async function onSubmit(values: OffreFormValues) {
    try {
      const offre = await mutation.mutateAsync(values);
      if (photos.length > 0) {
        setEnvoiPhotos(true);
        try {
          const { echecs } = await publicApi.uploadPhotosOffre(offre.idOffre, offre.jetonDepotPhotos, photos);
          if (echecs.length > 0) toast.warning(`${echecs.length} photo(s) non envoyée(s) : ${echecs.map((e) => e.nomFichier).join(", ")}.`);
        } catch (err) {
          toast.warning(`Offre transmise, mais l'envoi des photos a échoué : ${err instanceof ApiError ? err.message : "erreur inconnue"}.`);
        } finally {
          setEnvoiPhotos(false);
        }
      }
      toast.success("Votre offre a été transmise à l'agence.");
      reset();
      setPhotos([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nom complet" required error={errors.nomComplet?.message} {...register("nomComplet")} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Téléphone" required error={errors.telephone?.message} {...register("telephone")} />
        <Input
          label="Type de bien proposé"
          required
          placeholder="Cour, maison, véhicule…"
          error={errors.typeOffre?.message}
          {...register("typeOffre")}
        />
      </div>
      <Input label="Titre" required error={errors.titre?.message} {...register("titre")} />
      <Input label="Adresse" {...register("adresse")} />
      <Textarea label="Description" {...register("description")} />
      <PhotoPicker files={photos} onChange={setPhotos} />
      <Button type="submit" loading={mutation.isPending || envoiPhotos}>
        Proposer ce bien
      </Button>
    </form>
  );
}
