import type { MediaItem } from "@/components/ui/MediaGallery";
import type { MediaResponse } from "@/api/medias";

/**
 * Les pages publiques affichent les vrais médias (`/api/public/medias`, via `useMediaItems`).
 * Les images locales de public/images ne servent que de visuel de repli, assigné de façon
 * déterministe par id/catégorie, quand une entité n'a aucune photo.
 */

/** Convertit les médias renvoyés par l'API en éléments de galerie (le type vient du content-type stocké). */
export function toMediaItems(medias: MediaResponse[]): MediaItem[] {
  return medias.map((m): MediaItem => (m.typeMedia.startsWith("video/") ? { type: "video", url: m.url, poster: m.urlThumbnail ?? undefined } : { type: "image", url: m.url }));
}

/** Image de couverture d'une carte : première photo (miniature si dispo), sinon poster de la première vidéo. */
export function getCoverUrl(medias: MediaResponse[]): string | undefined {
  const photo = medias.find((m) => !m.typeMedia.startsWith("video/"));
  if (photo) return photo.urlThumbnail ?? photo.url;
  return medias.find((m) => m.urlThumbnail)?.urlThumbnail ?? undefined;
}

const MAISON_IMAGES = Array.from({ length: 8 }, (_, i) => `/images/maison-${i + 1}.jpg`);
const VEHICULE_IMAGES = ["/images/vehicule-1.jpg", "/images/vehicule-2.jpg"];
const EQUIPEMENT_IMAGES = ["/images/equipement-1.jpg", "/images/equipement-2.jpg", "/images/equipement-3.jpg"];
const SERVICE_IMAGES = ["/images/service-1.jpg", "/images/service-2.jpg", "/images/service-3.jpg"];

function pick(pool: string[], seed: number): string {
  return pool[Math.abs(seed) % pool.length]!;
}

/** Fait tourner le pool à partir d'un index de départ, pour varier la galerie d'une entité à l'autre. */
function rotate(pool: string[], seed: number): string[] {
  const start = Math.abs(seed) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)];
}

function toGallery(urls: string[]): MediaItem[] {
  return urls.map((url) => ({ type: "image", url }));
}

function bienServicePool(libelleCategorie: string, libelle: string): string[] {
  const text = `${libelleCategorie} ${libelle}`.toLowerCase();
  if (/v[ée]hicule|voiture|auto|camion|moto/.test(text)) return VEHICULE_IMAGES;
  if (/sono|son|audio|[ée]quipement|mat[ée]riel/.test(text)) return EQUIPEMENT_IMAGES;
  if (/nettoyage|m[ée]nage|service|entretien/.test(text)) return SERVICE_IMAGES;
  return [...VEHICULE_IMAGES, ...EQUIPEMENT_IMAGES, ...SERVICE_IMAGES];
}

export function getMaisonImage(idMaison: number): string {
  return pick(MAISON_IMAGES, idMaison);
}

/** Galerie de la maison (plusieurs médias) — le premier est le média principal utilisé sur la carte. */
export function getMaisonGallery(idMaison: number): MediaItem[] {
  return toGallery(rotate(MAISON_IMAGES, idMaison).slice(0, 4));
}

export function getAnnonceImage(idAnnonce: number): string {
  return pick(MAISON_IMAGES, idAnnonce);
}

export function getAnnonceGallery(idAnnonce: number): MediaItem[] {
  return toGallery(rotate(MAISON_IMAGES, idAnnonce).slice(0, 4));
}

/** Choisit le pool d'images selon des mots-clés de catégorie/libellé (véhicule, sonorisation/équipement, nettoyage/service). */
export function getBienServiceImage(idBienService: number, libelleCategorie: string, libelle: string): string {
  return pick(bienServicePool(libelleCategorie, libelle), idBienService);
}

export function getBienServiceGallery(idBienService: number, libelleCategorie: string, libelle: string): MediaItem[] {
  return toGallery(rotate(bienServicePool(libelleCategorie, libelle), idBienService));
}
