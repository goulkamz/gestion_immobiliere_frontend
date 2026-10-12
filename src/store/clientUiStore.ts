import { create } from "zustand";

const STORAGE_KEY = "gestimmo_client_sidebar_collapsed";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface ClientUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

/** État d'interface de l'espace client (repli de la sidebar), persisté côté navigateur. */
export const useClientUiStore = create<ClientUiState>((set, get) => ({
  sidebarCollapsed: readStoredCollapsed(),
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // pas bloquant si le stockage est indisponible
    }
    set({ sidebarCollapsed: next });
  },
}));
