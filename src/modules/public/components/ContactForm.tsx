import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { CheckCircle2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { contactSchema, type ContactFormValues } from "../schemas";
import { usePostContactMutation } from "@/hooks/queries/usePublicCatalog";
import { ApiError } from "@/api/http";
import { sanitizeInput } from "@/utils/validation";

interface ContactFormProps {
  defaultSujet?: string;
  defaultMessage?: string;
}

export function ContactForm({ defaultSujet, defaultMessage }: ContactFormProps) {
  const mutation = usePostContactMutation();
  const [sentSujet, setSentSujet] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { sujet: defaultSujet ?? "", message: defaultMessage ?? "" },
  });

  async function onSubmit(values: ContactFormValues) {
    setSentSujet(null);
    try {
      await mutation.mutateAsync({ ...values, message: sanitizeInput(values.message) });
      toast.success("Message envoyé, l'agence vous recontactera.");
      setSentSujet(values.sujet?.trim() || "votre demande");
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {sentSujet && (
        <p className="flex items-start gap-2 rounded-lg bg-success-50 p-3 text-sm text-success-700">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Message envoyé avec le sujet « {sentSujet} ». L&apos;agence vous recontactera rapidement.</span>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nom complet" required error={errors.nomComplet?.message} {...register("nomComplet")} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Téléphone" required error={errors.telephone?.message} {...register("telephone")} />
        <Input label="Sujet" {...register("sujet")} />
      </div>
      <Textarea label="Message" required error={errors.message?.message} {...register("message")} />
      <Button type="submit" loading={mutation.isPending}>
        Envoyer
      </Button>
    </form>
  );
}
