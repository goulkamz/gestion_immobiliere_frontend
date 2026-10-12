import DOMPurify from "dompurify";

/** Sanitise une chaîne libre avant affichage/envoi (anti-XSS). */
export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Règle de complexité du mot de passe alignée sur le backend :
 * 6-120 caractères, au moins une majuscule, une minuscule, un chiffre et
 * un caractère spécial ASCII (voir docs/api-frontend.md §2, CreateUserRequest).
 */
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{6,120}$/;

export function isStrongPassword(value: string): boolean {
  return PASSWORD_PATTERN.test(value);
}

export function passwordStrengthMessage(value: string): string {
  if (value.length < 6) return "Au moins 6 caractères";
  if (!/[a-z]/.test(value)) return "Au moins une minuscule";
  if (!/[A-Z]/.test(value)) return "Au moins une majuscule";
  if (!/\d/.test(value)) return "Au moins un chiffre";
  if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value)) return "Au moins un caractère spécial";
  return "Mot de passe valide";
}

export function isValidPhone(value: string): boolean {
  return /^[+]?[\d\s.-]{6,20}$/.test(value);
}
