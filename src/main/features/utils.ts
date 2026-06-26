// export function isObjectEmpty(obj: unknown): boolean {
//   if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
//     return false;
//   }
//   return Object.keys(obj).length === 0;
// }

export function isObjectEmpty(obj: unknown): boolean {
  // Retourne true si l'objet est null, undefined, ou sans propriétés
  if (obj === null || obj === undefined) return true;
  if (typeof obj !== "object") return true;
  if (Array.isArray(obj)) return true;

  return Object.keys(obj).length === 0;
}
