import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { KeyRound } from "lucide-react";
import { Button, FormCard, Input, PageLayout } from "@/components/ui";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas";
import { useForgotPasswordMutation } from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotMutation = useForgotPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotMutation.mutateAsync(values.email);
      toast.success("Si ce compte existe, un email de réinitialisation a été envoyé.");
      navigate("/reinitialiser-mot-de-passe");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible.");
    }
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-7.jpg">
      <FormCard
        tone="indigo"
        icon={KeyRound}
        title="Mot de passe oublié"
        description="Recevez un code de réinitialisation par email (valable ~1h)."
        footer={
          <Link to="/connexion" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
            Retour à la connexion
          </Link>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
          <Button type="submit" fullWidth loading={forgotMutation.isPending}>
            Envoyer le code
          </Button>
        </form>
      </FormCard>
    </PageLayout>
  );
}
