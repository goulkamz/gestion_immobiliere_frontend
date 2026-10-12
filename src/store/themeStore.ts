import { create } from "zustand";

export const AVAILABLE_THEMES = ["indigo-or"] as const;
export type ThemeName = (typeof AVAILABLE_THEMES)[number];

const STORAGE_KEY = "gestimmo_theme";

function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (AVAILABLE_THEMES as readonly string[]).includes(stored)) {
      return stored as ThemeName;
    }
  } catch {
    // localStorage indisponible (navigation privée, etc.) : on retombe sur le défaut
  }
  return "indigo-or";
}

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

function applyThemeToDocument(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // pas bloquant si le stockage est indisponible
    }
    set({ theme });
  },
}));

// Applique le thème initial dès le chargement du module (avant le premier rendu).
applyThemeToDocument(useThemeStore.getState().theme);
