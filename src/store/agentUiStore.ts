import { create } from "zustand";

const STORAGE_KEY = "gestimmo_agent_sidebar_collapsed";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface AgentUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

/** État d'interface de l'espace agent (repli de la sidebar), persisté côté navigateur. */
export const useAgentUiStore = create<AgentUiState>((set, get) => ({
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
