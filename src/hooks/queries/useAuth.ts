import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import type {
  AuthenticateRequest,
  CreateUserRequest,
  ResetPasswordRequest,
  TwoFactorVerifyRequest,
  UpdateProfileRequest,
} from "@/api/types";
import { useSessionStore } from "@/store/sessionStore";
import { notificationQueryKeys } from "./useNotifications";
import { logger } from "@/utils/logger";

export const authQueryKeys = {
  me: ["auth", "me"] as const,
};

/** Charge le profil courant une fois au montage de l'app (cookie déjà envoyé par le navigateur). */
export function useMeQuery() {
  const setProfile = useSessionStore((s) => s.setProfile);
  const clear = useSessionStore((s) => s.clear);

  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async () => {
      try {
        const profile = await authApi.me();
        setProfile(profile);
        return profile;
      } catch (err) {
        // Pas de session valide (visiteur non connecté, ou refresh déjà tenté par l'intercepteur).
        clear();
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** Charge le profil une fois la session ouverte (cookies httpOnly déjà posés par le serveur). */
function useOuvertureSession() {
  const queryClient = useQueryClient();
  const setProfile = useSessionStore((s) => s.setProfile);
  return async () => {
      // Les cookies httpOnly sont déjà posés par le serveur ; on charge le profil directement
      // (plutôt qu'un invalidateQueries, sans effet si la query "me" a été retirée du cache par
      // un logout précédent via removeQueries — invalider une entrée absente ne la recrée pas).
      const profile = await authApi.me();
      setProfile(profile);
      queryClient.setQueryData(authQueryKeys.me, profile);
  };
}

export function useLoginMutation() {
  const ouvrirSession = useOuvertureSession();
  return useMutation({
    mutationFn: (body: AuthenticateRequest) => authApi.signin(body),
    onSuccess: async (result) => {
      if (result.kind === "SESSION") await ouvrirSession();
    },
  });
}

export function useVerifyTwoFactorMutation() {
  const ouvrirSession = useOuvertureSession();
  return useMutation({
    mutationFn: (body: TwoFactorVerifyRequest) => authApi.verifyTwoFactor(body),
    onSuccess: () => ouvrirSession(),
  });
}

export const twoFactorQueryKey = ["auth", "2fa-status"] as const;

export function useTwoFactorStatusQuery(enabled = true) {
  return useQuery({ queryKey: twoFactorQueryKey, queryFn: () => authApi.twoFactorStatus(), enabled, staleTime: 60 * 1000 });
}

export function useTwoFactorInitierMutation() {
  return useMutation({ mutationFn: () => authApi.twoFactorInitier() });
}

export function useTwoFactorConfirmerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authApi.twoFactorConfirmer(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: twoFactorQueryKey }),
  });
}

export function useTwoFactorDesactiverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { motDePasse: string; code: string }) => authApi.twoFactorDesactiver(v.motDePasse, v.code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: twoFactorQueryKey }),
  });
}

export function useTwoFactorRegenererCodesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authApi.twoFactorRegenererCodes(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: twoFactorQueryKey }),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (body: CreateUserRequest) => authApi.signup(body),
  });
}

export function useActivationMutation() {
  return useMutation({
    mutationFn: (code: string) => authApi.activation(code),
  });
}

export function useResendCodeMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendCode(email),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => authApi.resetPassword(body),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clear = useSessionStore((s) => s.clear);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.removeQueries({ queryKey: authQueryKeys.me });
      queryClient.removeQueries({ queryKey: notificationQueryKeys.root });
      logger.log("Déconnexion effectuée.");
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setProfile = useSessionStore((s) => s.setProfile);
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => authApi.updateMe(body),
    onSuccess: (profile) => {
      setProfile(profile);
      queryClient.setQueryData(authQueryKeys.me, profile);
    },
  });
}
