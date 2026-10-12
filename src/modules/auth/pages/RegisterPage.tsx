import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UserPlus } from "lucide-react";
import { Button, FormCard, Input, Select, PageLayout } from "@/components/ui";
import { registerSchema, type RegisterFormValues } from "../schemas";
import { SIGNUP_DEFAULT_ROLE_ID } from "../publicRoles";
import { useSignupMutation } from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";
import { passwordStrengthMessage } from "@/utils/validation";

export function RegisterPage() {
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const password = watch("password") ?? "";

  async function onSubmit(values: RegisterFormValues) {
    try {
      const { confirmPassword, ...rest } = values;
      await signupMutation.mutateAsync({ ...rest, idRole: SIGNUP_DEFAULT_ROLE_ID });
      toast.success("Compte créé. Vérifiez votre email pour le code d'activation.");
      navigate("/activation", { state: { email: values.email } });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Inscription impossible.";
      toast.error(message);
    }
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-5.jpg">
      <FormCard
        tone="indigo"
        icon={UserPlus}
        title="Créer un compte"
        description="Créez votre compte pour rechercher et réserver un bien."
        maxWidthClassName="max-w-lg"
        footer={
          <>
            Déjà inscrit ?{" "}
            <Link to="/connexion" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
              Se connecter
            </Link>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nom" required error={errors.nom?.message} {...register("nom")} />
            <Input label="Prénom" required error={errors.prenom?.message} {...register("prenom")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Sexe"
              required
              placeholder="Sélectionner"
              defaultValue=""
              options={[
                { value: "M", label: "Masculin" },
                { value: "F", label: "Féminin" },
              ]}
              error={errors.sexe?.message}
              {...register("sexe")}
            />
            <Input label="Date de naissance" type="date" required error={errors.dateNaissance?.message} {...register("dateNaissance")} />
          </div>
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Téléphone" required error={errors.telephone?.message} {...register("telephone")} />
            <Input label="Téléphone secondaire" {...register("telephone1")} />
          </div>
          <Input
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            helperText={password ? passwordStrengthMessage(password) : "Majuscule, minuscule, chiffre et caractère spécial"}
            {...register("password")}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" fullWidth loading={signupMutation.isPending}>
            Créer mon compte
          </Button>
        </form>
      </FormCard>
    </PageLayout>
  );
}
