import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Button, Input, Textarea } from "@/components/ui";
import { demandeSchema, type DemandeFormInput, type DemandeFormValues } from "../schemas";
import { usePostDemandeMutation } from "@/hooks/queries/usePublicCatalog";
import { ApiError } from "@/api/http";

export function DemandeForm() {
  const mutation = usePostDemandeMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DemandeFormInput, unknown, DemandeFormValues>({ resolver: zodResolver(demandeSchema) });

  async function onSubmit(values: DemandeFormValues) {
    try {
      await mutation.mutateAsync(values);
      toast.success("Votre besoin a été transmis à l'agence.");
      reset();
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
          label="Type de bien recherché"
          required
          placeholder="Maison, studio, véhicule…"
          error={errors.typeBien?.message}
          {...register("typeBien")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Localisation souhaitée" {...register("localisationSouhaite")} />
        <Input label="Budget maximum (FCFA)" type="number" min={0} {...register("budgetMax")} />
      </div>
      <Textarea label="Description de votre besoin" {...register("description")} />
      <Button type="submit" loading={mutation.isPending}>
        Envoyer ma demande
      </Button>
    </form>
  );
}
