import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MailCheck } from "lucide-react";
import { Button, FormCard, Input, PageLayout } from "@/components/ui";
import { activationSchema, type ActivationFormValues } from "../schemas";
import { useActivationMutation, useResendCodeMutation } from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";

export function ActivationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const activationMutation = useActivationMutation();
  const resendMutation = useResendCodeMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivationFormValues>({ resolver: zodResolver(activationSchema) });

  async function onSubmit(values: ActivationFormValues) {
    try {
      await activationMutation.mutateAsync(values.code);
      toast.success("Compte activé, vous pouvez vous connecter.");
      navigate("/connexion");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Code invalide ou expiré.");
    }
  }

  async function handleResend() {
    if (!email) {
      toast.info("Renseignez votre email depuis la page d'inscription pour renvoyer un code.");
      return;
    }
    try {
      await resendMutation.mutateAsync(email);
      toast.success("Un nouveau code a été envoyé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible.");
    }
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-4.jpg">
      <FormCard
        tone="indigo"
        icon={MailCheck}
        title="Activer mon compte"
        description={email ? `Un code a été envoyé à ${email}.` : "Saisissez le code reçu par email."}
        footer={
          <Link to="/connexion" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
            Retour à la connexion
          </Link>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Code d'activation" required error={errors.code?.message} {...register("code")} />
          <Button type="submit" fullWidth loading={activationMutation.isPending}>
            Activer mon compte
          </Button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendMutation.isPending}
          className="mt-4 w-full text-center text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 disabled:opacity-60"
        >
          Renvoyer le code
        </button>
      </FormCard>
    </PageLayout>
  );
}
