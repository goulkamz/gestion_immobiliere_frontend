import React, { useEffect } from "react";
import "../resources/styles/all.scss";
import { useCookies } from "react-cookie";
import Router from "./components/Routes/Router";
import { useDispatch } from "react-redux";
import { isObjectEmpty } from "./features/utils";
import {
  setUser,
  type User as SliceUser,
} from "./features/redux/slices/user/userSlice";
import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";

// Réutiliser le type User du slice
type User = SliceUser;

// Interface pour les cookies - pas de type générique nécessaire
interface CookieData {
  user?: User;
  JWTToken?: string;
}

export default function App(): React.ReactElement {
  // Correction: Ne pas utiliser de type générique avec useCookies
  const [cookies] = useCookies(["user", "JWTToken"]);
  const dispatch = useDispatch();

  // Récupération de l'utilisateur avec vérification et cast de type
  const user = (cookies.user as User) || ({} as User);

  // Configuration des intercepteurs axios
  useEffect(() => {
    // Intercepteur pour ajouter le token JWT
    const interceptor = axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = cookies.JWTToken as string;
        if (token && config.headers) {
          config.headers.Token = token;
        }
        return config;
      },
      (error): Promise<never> => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      },
    );

    // Configuration globale d'axios
    axios.defaults.withCredentials = true;

    // Nettoyage de l'intercepteur
    return (): void => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [cookies.JWTToken]);

  // Dispatch de l'utilisateur dans le store Redux
  useEffect((): void => {
    if (user && !isObjectEmpty(user)) {
      dispatch(setUser(user));
    }
  }, [user, dispatch]);

  return <Router />;
}
