import { describe, expect, it } from "vitest";
import { isStrongPassword, isValidPhone, sanitizeInput } from "./validation";

describe("sanitizeInput", () => {
  it("retire les balises HTML/script d'une chaîne libre", () => {
    expect(sanitizeInput('<script>alert("xss")</script>Bonjour')).toBe("Bonjour");
    expect(sanitizeInput("  texte normal  ")).toBe("texte normal");
  });
});

describe("isStrongPassword", () => {
  it("accepte un mot de passe conforme à la règle backend", () => {
    expect(isStrongPassword("Azerty1!")).toBe(true);
  });

  it("rejette un mot de passe sans caractère spécial", () => {
    expect(isStrongPassword("Azerty12")).toBe(false);
  });

  it("rejette un mot de passe trop court", () => {
    expect(isStrongPassword("Az1!")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("accepte un numéro international", () => {
    expect(isValidPhone("+22670000000")).toBe(true);
  });

  it("rejette une chaîne non numérique", () => {
    expect(isValidPhone("abc")).toBe(false);
  });
});
