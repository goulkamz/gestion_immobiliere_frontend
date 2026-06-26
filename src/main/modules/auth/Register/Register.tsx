import { useState } from "react";
import "./Register.scss";
import AuthLayout from "../../../layouts/AuthLayout/AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import APIRoutes from "../../../features/APIRest/APIRoutes";
import { useCookies } from "react-cookie";
import modules from "../../modules";

// Définition du type pour les données du formulaire d'inscription
interface RegisterFormData {
  username: string;
  password: string;
}

// Définition du type pour la réponse de l'API
interface RegisterResponse {
  status: string;
  datas?: {
    id?: string;
    username?: string;
    email?: string;
    roles?: string[];
    [key: string]: any;
  };
  message?: string;
}

interface LoginResponse {
  status: string;
  datas: {
    id?: string;
    username?: string;
    email?: string;
    roles?: string[];
    [key: string]: any;
  };
}

export default function Register() {
  const navigate = useNavigate();

  // eslint-disable-next-line
  const [, setCookies] = useCookies(["user"]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ mode: "onTouched" });

  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (datas: RegisterFormData): Promise<void> => {
    setLoading(true);

    try {
      // Envoi de la requête d'inscription
      const registerResponse = (await APIRoutes.auth.register.send(
        datas,
        setLoading,
      )) as RegisterResponse;

      if (registerResponse.status === "OK") {
        // Auto-connexion après inscription réussie
        const loginResponse = (await APIRoutes.auth.login.send(
          datas,
          setLoading,
        )) as LoginResponse;

        if (loginResponse.status === "OK") {
          const User = loginResponse.datas;
          setCookies("user", User, {
            maxAge: 30 * 60, // 30 minutes
            path: "/",
          });
        }

        navigate("/");
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="AuthLayout__title title--sub text--underline">
        INSCRIPTION
        <hr />
      </div>

      <form
        id="Register"
        className="form"
        onSubmit={handleSubmit(handleRegister)}
      >
        <input
          type="text"
          className="input"
          placeholder="Nom d'utilisateur"
          {...register("username", {
            required: "Champ obligatoire",
            minLength: {
              value: 3,
              message:
                "Le nom d'utilisateur doit contenir au moins 3 caractères",
            },
          })}
        />
        {errors.username && (
          <div className="input--err">{errors.username.message}</div>
        )}

        <input
          type="password"
          className="input"
          placeholder="Mot de passe"
          {...register("password", {
            required: "Champ obligatoire",
            minLength: {
              value: 3,
              message: "Mot de passe trop court",
            },
          })}
        />
        {errors.password && (
          <div className="input--err">{errors.password.message}</div>
        )}

        <input
          className="btn btn--primary--lt input--submit"
          type="submit"
          value={loading ? "Chargement..." : "Envoyez"}
          disabled={loading}
        />
      </form>

      <span className="infoText">
        Vous avez déjà un compte ?{" "}
        <Link
          className="link link--secondary"
          to={modules.auth.routes.Signin.path}
        >
          Connectez-vous
        </Link>
      </span>
    </AuthLayout>
  );
}
