/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import type { Plugin } from "vite";

// Ajoute quelques en-têtes de sécurité de base en dev (repris du pattern piste-frontend).
function securityHeaders(): Plugin {
  return {
    name: "security-headers",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), securityHeaders()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // "forks" échoue à démarrer les workers sur ce poste (chemin avec espace/accent) : "threads" est plus fiable ici.
    pool: "threads",
  },
});
