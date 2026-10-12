import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

const LoginPage = lazy(() => import("@/modules/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/modules/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const ActivationPage = lazy(() => import("@/modules/auth/pages/ActivationPage").then((m) => ({ default: m.ActivationPage })));
const ForgotPasswordPage = lazy(() =>
  import("@/modules/auth/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("@/modules/auth/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);
const ProfilePage = lazy(() => import("@/modules/profile/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));

export const authRoutes = (
  <>
    <Route path="connexion" element={<LoginPage />} />
    <Route path="inscription" element={<RegisterPage />} />
    <Route path="activation" element={<ActivationPage />} />
    <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
    <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
    <Route
      path="profil"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
  </>
);
