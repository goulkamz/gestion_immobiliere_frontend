import { describe, expect, it } from "vitest";
import { http, ApiError } from "./http";

describe("http client", () => {
  it("envoie les cookies (withCredentials) et n'ajoute jamais de header Authorization", () => {
    expect(http.defaults.withCredentials).toBe(true);
    expect((http.defaults.headers.common as Record<string, unknown>).Authorization).toBeUndefined();
  });
});

describe("ApiError", () => {
  it("reprend le message et le code de l'enveloppe backend", () => {
    const error = new ApiError(
      { success: false, message: "Email déjà utilisé", code: "EMAIL_ALREADY_EXISTS", timestamp: "now" },
      409,
      "fallback",
    );
    expect(error.message).toBe("Email déjà utilisé");
    expect(error.code).toBe("EMAIL_ALREADY_EXISTS");
    expect(error.status).toBe(409);
  });

  it("expose les erreurs de champ pour une erreur de validation", () => {
    const error = new ApiError(
      {
        success: false,
        message: "Erreur de validation des champs",
        code: "VALIDATION_ERROR",
        timestamp: "now",
        errors: { email: "Email invalide" },
      },
      400,
      "fallback",
    );
    expect(error.fieldErrors).toEqual({ email: "Email invalide" });
  });

  it("retombe sur le message par défaut si aucune enveloppe n'est fournie", () => {
    const error = new ApiError(undefined, undefined, "Erreur réseau");
    expect(error.message).toBe("Erreur réseau");
    expect(error.code).toBe("UNKNOWN_ERROR");
  });
});
