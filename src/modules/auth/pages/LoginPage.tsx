import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, LogIn, ShieldCheck } from "lucide-react";
import { Button, FormCard, Input, PageLayout } from "@/components/ui";
import { loginSchema, type LoginFormValues } from "../schemas";
import { useLoginMutation, useVerifyTwoFactorMutation } from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const verifyMutation = useVerifyTwoFactorMutation();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [faireConfiance, setFaireConfiance] = useState(false);
  const [heuresConfiance, setHeuresConfiance] = useState(12);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function redirigerApresConnexion() {
    const state = location.state as { from?: { pathname: string; search?: string }; resume?: unknown } | null;
      const target = state?.from ? `${state.from.pathname}${state.from.search ?? ""}` : "/";
    navigate(target, { replace: true, state: state?.resume ? { resume: state.resume } : undefined });
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await loginMutation.mutateAsync(values);
      if (result.kind === "TWO_FACTOR") {
        setChallengeToken(result.challengeToken);
        setHeuresConfiance(result.heuresConfiance);
        return;
      }
      redirigerApresConnexion();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Connexion impossible.";
      toast.error(message);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken || !code.trim()) return;
    try {
      await verifyMutation.mutateAsync({ challengeToken, code: code.trim(), faireConfiance });
      redirigerApresConnexion();
    } catch (err) {
      if (err instanceof ApiError && err.code === "TWO_FACTOR_CHALLENGE_EXPIRED") {
        // Défi expiré : on repart de la saisie du mot de passe.
        setChallengeToken(null);
        setCode("");
      }
      toast.error(err instanceof ApiError ? err.message : "Vérification impossible.");
    }
  }

  if (challengeToken) {
    return (
      <PageLayout narrow decorated backgroundImage="/images/fonds/connexion.webp">
        <FormCard
          tone="indigo"
          icon={ShieldCheck}
          title="Vérification en deux étapes"
          description="Saisissez le code à 6 chiffres de votre application d'authentification, ou un code de secours."
          footer={
            <button type="button" className="font-medium text-primary-700 hover:text-primary-800" onClick={() => { setChallengeToken(null); setCode(""); }}>
              Retour à la connexion
            </button>
          }
        >
          <form className="space-y-4" onSubmit={onVerify} noValidate>
            <Input
              label="Code de vérification"
              autoComplete="one-time-code"
              inputMode="text"
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={faireConfiance} onChange={(e) => setFaireConfiance(e.target.checked)} />
              Faire confiance à cet appareil pendant {heuresConfiance} h
            </label>
            <Button type="submit" fullWidth loading={verifyMutation.isPending} disabled={!code.trim()}>
              Valider
            </Button>
          </form>
        </FormCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/fonds/connexion.webp">
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
