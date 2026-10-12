import { http } from "./http";
import type {
  ApiSuccessResponse,
  AuthenticateRequest,
  CreateUserRequest,
  ProfileResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserInfoResponse,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export const authApi = {
  signin: (body: AuthenticateRequest) => unwrap<UserInfoResponse>(http.post("/auth/signin", body)),

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
