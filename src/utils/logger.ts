/**
 * Logger centralisé : redacte les champs sensibles et coupe log/warn/debug
 * hors développement. À utiliser PARTOUT dans l'app à la place de `console.*`
 * — aucun `console.log` direct ne doit apparaître dans le reste du code.
 */

const SENSITIVE_KEYS = [
  "password",
  "motdepasse",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
  "authorization",
  "creditcard",
  "cvv",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((k) => normalized.includes(k));
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? "[REDACTED]" : redact(val, depth + 1);
  }
  return result;
}

function redactArgs(args: unknown[]): unknown[] {
  return args.map((arg) => redact(arg));
}

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...redactArgs(args));
  },
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...redactArgs(args));
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...redactArgs(args));
  },
  error: (...args: unknown[]): void => {
    // Les erreurs restent visibles en prod (utile pour le support), mais redactées.
    console.error(...redactArgs(args));
  },
};
