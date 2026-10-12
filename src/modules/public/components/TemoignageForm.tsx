import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { temoignageSchema, type TemoignageFormInput, type TemoignageFormValues } from "../schemas";
import { useCreateTemoignageMutation } from "@/hooks/queries/useTemoignages";
import { temoignageRoleLabel } from "@/utils/temoignage";
import { sanitizeInput } from "@/utils/validation";
import { ApiError } from "@/api/http";
import type { TemoignageRole } from "@/api/types";

const ROLES: Exclude<TemoignageRole, "AGENCE">[] = ["PROPRIETAIRE", "LOCATAIRE", "AUTRE"];

export function TemoignageForm() {
  const mutation = useCreateTemoignageMutation();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TemoignageFormInput, unknown, TemoignageFormValues>({
    resolver: zodResolver(temoignageSchema),
    defaultValues: { siteWeb: "" },
  });

  async function onSubmit(values: TemoignageFormValues) {
    setSent(false);
    try {
      await mutation.mutateAsync({
        ...values,
        nomAuteur: sanitizeInput(values.nomAuteur),
        texte: sanitizeInput(values.texte),
        siteWeb: values.siteWeb ?? "",
      });
      setSent(true);
      reset({ siteWeb: "" });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError("root", { message: "Trop d'envois, réessayez plus tard." });
        } else if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field === "nomAuteur" || field === "role" || field === "texte" || field === "note") {
              setError(field, { message });
            } else {
              setError("root", { message });
            }
          }
        } else {
          setError("root", { message: err.message });
        }
      } else {
        setError("root", { message: "Envoi impossible." });
      }
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {sent && (
        <p className="flex items-start gap-2 rounded-lg bg-success-50 p-3 text-sm text-success-700">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Merci, votre témoignage sera publié après validation.</span>
        </p>
      )}
      {errors.root?.message && <p className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{errors.root.message}</p>}

      {/* Champ piège anti-robot : invisible et inaccessible au clavier pour un utilisateur réel. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="siteWeb">Site web</label>
        <input id="siteWeb" type="text" tabIndex={-1} autoComplete="off" {...register("siteWeb")} />
      </div>

      <Input label="Nom complet" required error={errors.nomAuteur?.message} {...register("nomAuteur")} />
      <Select
        label="Vous êtes"
        required
        placeholder="Choisissez un rôle"
        error={errors.role?.message}
        options={ROLES.map((r) => ({ value: r, label: temoignageRoleLabel(r) }))}
        {...register("role")}
      />
      <Textarea
        label="Votre témoignage"
        required
        helperText="10 à 1000 caractères, sans lien ni adresse de site."
        error={errors.texte?.message}
        {...register("texte")}
      />
      <Select
        label="Note (optionnelle)"
        placeholder="Pas de note"
        error={errors.note?.message}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} / 5` }))}
        {...register("note")}
      />
      <Button type="submit" loading={mutation.isPending}>
        Envoyer mon témoignage
      </Button>
    </form>
  );
}
