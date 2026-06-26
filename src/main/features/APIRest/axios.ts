import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

const proxy = "http://localhost:8080";

const api = axios.create({
  baseURL: proxy,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.defaults.withCredentials = true;

// Types pour la réponse backend
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  code: string;
  timestamp: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  timestamp: string;
  error?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type pour la fonction setLoading
type SetLoadingFunction = (loading: boolean) => void;

// Messages d'erreur réseau
const networkError: ApiErrorResponse = {
  success: false,
  message:
    "Erreur de connexion réseau. Veuillez vérifier votre connexion internet.",
  code: "NETWORK_ERROR",
  timestamp: new Date().toISOString(),
};

// Configuration par défaut
const defaultConfig: AxiosRequestConfig = {
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};

// Intercepteur pour ajouter le token d'authentification

// api.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = localStorage.getItem("token");
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error: AxiosError) => {
//     return Promise.reject(error);
//   },
// );

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse<ApiResponse> => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      return response.data;
    }
    // Sinon, envelopper dans le format standard
    response.data = {
      success: true,
      message: "Requête traitée avec succès",
      code: "SUCCESS",
      timestamp: new Date().toISOString(),
      data: response.data,
    };

    return response;
  },
  (error: AxiosError) => {
    // Transformer les erreurs en format standard
    let errorResponse: ApiErrorResponse = {
      success: false,
      message: "Une erreur est survenue",
      code: "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    };

    if (error.code === "ERR_NETWORK") {
      errorResponse = networkError;
    } else if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          errorResponse.message = data?.message || "Requête invalide";
          errorResponse.code = "BAD_REQUEST";
          break;
        case 401:
          errorResponse.message = "Non autorisé. Veuillez vous reconnecter.";
          errorResponse.code = "UNAUTHORIZED";
          break;
        case 403:
          errorResponse.message =
            "Accès interdit. Vous n'avez pas les permissions nécessaires.";
          errorResponse.code = "FORBIDDEN";
          break;
        case 404:
          errorResponse.message = "Ressource non trouvée";
          errorResponse.code = "NOT_FOUND";
          break;
        case 500:
          errorResponse.message = "Erreur interne du serveur";
          errorResponse.code = "INTERNAL_SERVER_ERROR";
          break;
        default:
          errorResponse.message = data?.message || `Erreur ${status}`;
          errorResponse.code = `ERROR_${status}`;
      }

      errorResponse.error = data?.error;
    } else if (error.request) {
      errorResponse.message = "Pas de réponse du serveur";
      errorResponse.code = "NO_RESPONSE";
    }

    return Promise.reject({ ...error, customResponse: errorResponse });
  },
);

/**
 * Requête GET
 */
export async function restGet<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  setLoading: SetLoadingFunction = () => {},
): Promise<ApiResponse<T>> {
  setLoading(true);

  try {
    const response = await api.get<ApiResponse<T>>(proxy + url, {
      ...defaultConfig,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    return error.customResponse as ApiErrorResponse;
  } finally {
    setLoading(false);
  }
}

/**
 * Requête POST
 */
export async function restPost<T = any, D = any>(
  url: string,
  data: D,
  config?: AxiosRequestConfig,
  setLoading: SetLoadingFunction = () => {},
): Promise<ApiResponse<T>> {
  setLoading(true);

  try {
    const response = await api.post<ApiResponse<T>>(proxy + url, data, {
      ...defaultConfig,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    return error.customResponse as ApiErrorResponse;
  } finally {
    setLoading(false);
  }
}

/**
 * Requête PUT (mise à jour)
 */
export async function restUpdate<T = any, D = any>(
  url: string,
  data: D,
  config?: AxiosRequestConfig,
  setLoading: SetLoadingFunction = () => {},
): Promise<ApiResponse<T>> {
  setLoading(true);

  try {
    const response = await api.put<ApiResponse<T>>(proxy + url, data, {
      ...defaultConfig,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    return error.customResponse as ApiErrorResponse;
  } finally {
    setLoading(false);
  }
}

/**
 * Requête DELETE
 */
export async function restDelete<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  setLoading: SetLoadingFunction = () => {},
): Promise<ApiResponse<T>> {
  setLoading(true);

  try {
    const response = await api.delete<ApiResponse<T>>(proxy + url, {
      ...defaultConfig,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    return error.customResponse as ApiErrorResponse;
  } finally {
    setLoading(false);
  }
}

// Export des types pour utilisation externe
export type { SetLoadingFunction };
