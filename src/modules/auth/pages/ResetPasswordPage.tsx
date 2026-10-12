import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShieldCheck } from "lucide-react";
import { Button, FormCard, Input, PageLayout } from "@/components/ui";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas";
import { useResetPasswordMutation } from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";
import { passwordStrengthMessage } from "@/utils/validation";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const resetMutation = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const newPassword = watch("newPassword") ?? "";

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await resetMutation.mutateAsync({ code: values.code, newPassword: values.newPassword });
      toast.success("Mot de passe réinitialisé, vous pouvez vous connecter.");
      navigate("/connexion");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Réinitialisation impossible.");
    }
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-8.jpg">
      <FormCard
        tone="indigo"
        icon={ShieldCheck}
        title="Réinitialiser le mot de passe"
        description="Saisissez le code reçu par email et votre nouveau mot de passe."
        footer={
          <Link to="/connexion" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
            Retour à la connexion
          </Link>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Code de réinitialisation" required error={errors.code?.message} {...register("code")} />
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            required
            error={errors.newPassword?.message}
            helperText={newPassword ? passwordStrengthMessage(newPassword) : undefined}
            {...register("newPassword")}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" fullWidth loading={resetMutation.isPending}>
            Réinitialiser
          </Button>
        </form>
      </FormCard>
    </PageLayout>
  );
}
