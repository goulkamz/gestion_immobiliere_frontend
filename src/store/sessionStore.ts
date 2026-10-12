import { create } from "zustand";
import type { ProfileResponse, Role } from "@/api/types";

interface SessionState {
  profile: ProfileResponse | null;
  /** true tant que le premier /users/me n'a pas répondu (évite un flash "déconnecté"). */
  isLoading: boolean;
  setProfile: (profile: ProfileResponse) => void;
  clear: () => void;
  finishLoading: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile, isLoading: false }),
  clear: () => set({ profile: null, isLoading: false }),
  finishLoading: () => set({ isLoading: false }),
}));

export function selectIsAuthenticated(state: SessionState): boolean {
  return state.profile !== null;
}

export function selectRole(state: SessionState): Role | null {
  return (state.profile?.role as Role | undefined) ?? null;
}
