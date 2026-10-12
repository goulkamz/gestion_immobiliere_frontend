import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { logger } from "@/utils/logger";
import type { ApiErrorPayload } from "./types";

/**
 * Client HTTP unique de l'application.
 *
 * Auth 100% cookies httpOnly côté backend (access_token/refresh_token,
 * SameSite=Strict, Secure) : on ne stocke ni ne lit JAMAIS de token en JS,
 * `withCredentials: true` suffit — le navigateur gère les cookies.
 * Voir gestionImmobiliere/docs/api-frontend.md §1.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Erreur applicative normalisée, construite à partir de l'enveloppe backend. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  readonly fieldErrors: Record<string, string> | undefined;

  constructor(payload: ApiErrorPayload | undefined, status: number | undefined, fallbackMessage: string) {
    super(payload?.message ?? fallbackMessage);
    this.name = "ApiError";
    this.code = payload?.code ?? "UNKNOWN_ERROR";
    this.status = status;
    this.fieldErrors = payload && "errors" in payload ? payload.errors : undefined;
  }
}

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];
let onSessionExpired: (() => void) | null = null;

/** Branché par le sessionStore : appelé quand le refresh échoue définitivement. */
export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

function isAuthRoute(url: string | undefined): boolean {
  return !!url && (url.includes("/auth/signin") || url.includes("/auth/refresh-token") || url.includes("/auth/logout"));
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => config);

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.code === "ERR_NETWORK") {
      return Promise.reject(new ApiError(undefined, undefined, "Erreur de connexion réseau. Vérifiez votre connexion internet."));
    }

    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute(originalRequest.url)) {
      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return http(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await http.post("/auth/refresh-token");
        pendingQueue.forEach((resolve) => resolve());
        pendingQueue = [];
        return http(originalRequest);
      } catch (refreshError) {
        pendingQueue = [];
        logger.warn("Session expirée, échec du rafraîchissement du token.");
        onSessionExpired?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(new ApiError(error.response?.data, status, "Une erreur est survenue."));
  },
);
