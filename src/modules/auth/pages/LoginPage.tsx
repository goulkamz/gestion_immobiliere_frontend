import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button, FormCard, Input, PageLayout } from "@/components/ui";
import { loginSchema, type LoginFormValues } from "../schemas";
import { useLoginMutation } from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(values);
      const state = location.state as { from?: { pathname: string; search?: string }; resume?: unknown } | null;
      const target = state?.from ? `${state.from.pathname}${state.from.search ?? ""}` : "/";
      navigate(target, { replace: true, state: state?.resume ? { resume: state.resume } : undefined });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Connexion impossible.";
      toast.error(message);
    }
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-2.jpg">
      <FormCard
        tone="indigo"
        icon={LogIn}
        title="Connexion"
        description="Accédez à votre espace GestImmo."
        footer={
          <>
            Pas encore de compte ?{" "}
            <Link to="/inscription" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
              Créer un compte
            </Link>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            icon={<Mail size={16} />}
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            icon={<Lock size={16} />}
            required
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link to="/mot-de-passe-oublie" className="text-sm font-medium text-primary-700 transition-colors hover:text-primary-800">
              Mot de passe oublié ?
            </Link>
          </div>
          <Button type="submit" fullWidth loading={loginMutation.isPending}>
            Se connecter
          </Button>
        </form>
      </FormCard>
    </PageLayout>
  );
}
