import { useState } from "react";
import "./Login.scss";
import AuthLayout from "../../../layouts/AuthLayout/AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import APIRoutes from "../../../features/APIRest/APIRoutes";
import { useCookies } from "react-cookie";
import modules from "../../modules";
import type { ApiSuccessResponse } from "../../../features/APIRest/axios";

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginResponseData {
  username: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: string | null;
  roles: string[];
}

// Définition du type pour les données utilisateur
interface UserData {
  id: string;
  username: string;
  email?: string;
  roles: string[];
}

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ mode: "onTouched" });

  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [, setCookie] = useCookies(["user"]);

  async function handleLogin(datas: LoginFormData): Promise<void> {
    try {
      // Attendre la réponse de l'API
      const response: ApiSuccessResponse<UserData> =
        await APIRoutes.auth.login.send(datas, setLoading);

      console.log("Response:", response);

      // Vérifier si la connexion a réussi
      if (response.success && response.data) {
        const userData = response.data;
        console.log("User data:", userData);

        // Stocker l'utilisateur dans les cookies
        setCookie("user", userData, {
          path: "/",
          maxAge: 24 * 60 * 60, // 24 heures
        });

        // Optionnel : stocker le token si présent
        // if (userData.token) {
        //   localStorage.setItem("token", userData.token);
        // }

        // Rediriger vers l'accueil
        navigate("/");
      } else {
        console.error("Login failed:", response.message);
        // Afficher un message d'erreur à l'utilisateur
        alert(response.message || "Échec de la connexion");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Gérer l'erreur formatée par l'intercepteur
      if (error.customResponse) {
        alert(error.customResponse.message);
      } else if (error.message) {
        alert(error.message);
      } else {
        alert("Une erreur est survenue lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="AuthLayout__title title--sub text--underline">
        CONNEXION
        <hr />
      </div>
      <form id="Login" className="form" onSubmit={handleSubmit(handleLogin)}>
        <input
          type="text"
          className="input"
          placeholder="Nom d'utilisateur"
          {...register("username", {
            required: "Champ obligatoire",
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
        Vous n'avez pas encore de compte ?{" "}
        <Link
          className="link link--secondary"
          to={modules.auth.routes.Signup.path}
        >
          Inscrivez vous
        </Link>
      </span>
    </AuthLayout>
  );
}
