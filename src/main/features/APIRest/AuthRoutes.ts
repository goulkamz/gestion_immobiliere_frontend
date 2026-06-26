import { restPost } from "./axios";
import type { ApiSuccessResponse } from "./axios";

interface AuthData {
  [key: string]: any;
}

// Définir le type de réponse attendu
interface LoginResponseData {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  token?: string;
}
const AuthRoutes = {
  register: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/signup";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  login: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/signin";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  activation: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/activation";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  resendCodeActivation: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/resend-code";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  forgotPassword: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/forgot-password";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  resetPassword: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/reset-password";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  forgotPasswordResend: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/forgot-password/resend";
      return restPost(path, datas, undefined, setLoading);
    },
  },

  logout: {
    send: (
      datas: AuthData,
      setLoading: (loading: boolean) => void = () => {},
    ): Promise<any> => {
      const path = "/auth/signout";
      return restPost(path, datas, undefined, setLoading);
    },
  },
};

export default AuthRoutes;
