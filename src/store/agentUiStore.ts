import { create } from "zustand";

const STORAGE_KEY = "gestimmo_agent_sidebar_collapsed";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const VILLE_KEY = "gestimmo_agent_ville";

/** Choix de ville de l'agent : "" = toutes les villes, "autres" = sans ville répertoriée, sinon l'identifiant de la ville. */
export type VilleChoix = "" | "autres" | `${number}`;

function readStoredVille(): VilleChoix {
  try {
    const v = localStorage.getItem(VILLE_KEY);
    return v === "autres" || (v !== null && /^\d+$/.test(v)) ? (v as VilleChoix) : "";
  } catch {
    return "";
  }
}

interface AgentUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  ville: VilleChoix;
  setVille: (ville: VilleChoix) => void;
}

/** État d'interface de l'espace agent (repli de la sidebar, ville filtrée), persisté côté navigateur. */
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
  ville: readStoredVille(),
  setVille: (ville) => {
    try {
      localStorage.setItem(VILLE_KEY, ville);
    } catch {
      // pas bloquant si le stockage est indisponible
    }
    set({ ville });
  },
}));
