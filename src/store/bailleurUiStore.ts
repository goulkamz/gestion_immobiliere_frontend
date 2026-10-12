import { create } from "zustand";

const STORAGE_KEY = "gestimmo_bailleur_sidebar_collapsed";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface BailleurUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

/** État d'interface de l'espace bailleur (repli de la sidebar), persisté côté navigateur. */
export const useBailleurUiStore = create<BailleurUiState>((set, get) => ({
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
