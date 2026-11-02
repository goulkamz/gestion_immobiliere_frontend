import { http } from "./http";
import type {
  ApiSuccessResponse,
  AuthenticateRequest,
  CreateUserRequest,
  ProfileResponse,
  ResetPasswordRequest,
  TwoFactorChallenge,
  TwoFactorSetup,
  TwoFactorStatus,
  TwoFactorVerifyRequest,
  UpdateProfileRequest,
  UserInfoResponse,
} from "./types";

/** Résultat de la première étape : session ouverte, ou code de vérification à saisir. */
export type SigninResult = { kind: "SESSION"; user: UserInfoResponse } | { kind: "TWO_FACTOR"; challengeToken: string };

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export const authApi = {
  signin: async (body: AuthenticateRequest): Promise<SigninResult> => {
    const { data } = await http.post<ApiSuccessResponse<UserInfoResponse | TwoFactorChallenge>>("/auth/signin", body);
    if (data.code === "TWO_FACTOR_REQUIRED") return { kind: "TWO_FACTOR", challengeToken: (data.data as TwoFactorChallenge).challengeToken };
    return { kind: "SESSION", user: data.data as UserInfoResponse };
  },

  verifyTwoFactor: (body: TwoFactorVerifyRequest) => unwrap<UserInfoResponse>(http.post("/auth/2fa/verify", body)),

  twoFactorStatus: () => unwrap<TwoFactorStatus>(http.get("/users/me/2fa")),

  twoFactorInitier: () => unwrap<TwoFactorSetup>(http.post("/users/me/2fa/initier")),

  twoFactorConfirmer: (code: string) => unwrap<{ codesSecours: string[] }>(http.post("/users/me/2fa/confirmer", { code })),

  twoFactorDesactiver: (motDePasse: string, code: string) => http.post("/users/me/2fa/desactiver", { motDePasse, code }),

  twoFactorRegenererCodes: (code: string) => unwrap<{ codesSecours: string[] }>(http.post("/users/me/2fa/codes-secours", { code })),

  signup: (body: CreateUserRequest) => http.post<ApiSuccessResponse<undefined>>("/auth/signup", body),

  activation: (code: string) => http.post("/auth/activation", { code }),

  resendCode: (email: string) => http.post("/auth/resend-code", { email }),

  forgotPassword: (email: string) => http.post("/auth/forgot-password", { email }),

  resetPassword: (body: ResetPasswordRequest) => http.post("/auth/reset-password", body),

  forgotPasswordResend: (email: string) => http.post("/auth/forgot-password/resend", { email }),

  logout: () => http.post("/auth/logout"),

  logoutAll: () => http.post("/auth/logout-all"),

  me: () => unwrap<ProfileResponse>(http.get("/users/me")),

  updateMe: (body: UpdateProfileRequest) => unwrap<ProfileResponse>(http.put("/users/me", body)),
};
