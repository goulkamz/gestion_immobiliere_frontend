import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  publicApi,
  type AnnonceListParams,
  type BienServiceListParams,
  type MaisonListParams,
  type SecteurListParams,
} from "@/api/public";
import type { CreateContactRequest, CreateDemandeRequest, CreateOffreRequest } from "@/api/types";

export const publicQueryKeys = {
  maisons: (params?: MaisonListParams) => ["public", "maisons", params] as const,
  maison: (id: number) => ["public", "maisons", id] as const,
  biensServices: (params?: BienServiceListParams) => ["public", "biens-services", params] as const,
  bienService: (id: number) => ["public", "biens-services", id] as const,
  annonces: (params?: AnnonceListParams) => ["public", "annonces", params] as const,
  annonce: (id: number) => ["public", "annonces", id] as const,
  stats: ["public", "stats"] as const,
  recentAnnonces: ["public", "stats", "annonces-recentes"] as const,
  villes: ["public", "villes"] as const,
  secteurs: (params?: SecteurListParams) => ["public", "secteurs", params] as const,
  parametres: ["public", "parametres"] as const,
};

export function useMaisonsQuery(params?: MaisonListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: publicQueryKeys.maisons(params),
    queryFn: () => publicApi.getMaisons(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useMaisonQuery(id: number) {
  return useQuery({ queryKey: publicQueryKeys.maison(id), queryFn: () => publicApi.getMaison(id), enabled: id > 0 });
}

export function useBiensServicesQuery(params?: BienServiceListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: publicQueryKeys.biensServices(params),
    queryFn: () => publicApi.getBiensServices(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useBienServiceQuery(id: number) {
  return useQuery({
    queryKey: publicQueryKeys.bienService(id),
    queryFn: () => publicApi.getBienService(id),
    enabled: id > 0,
  });
}

export function useAnnoncesQuery(params?: AnnonceListParams) {
  return useQuery({ queryKey: publicQueryKeys.annonces(params), queryFn: () => publicApi.getAnnonces(params), placeholderData: keepPreviousData });
}

export function useAnnonceQuery(id: number) {
  return useQuery({ queryKey: publicQueryKeys.annonce(id), queryFn: () => publicApi.getAnnonce(id), enabled: id > 0 });
}

export function usePublicStatsQuery() {
  return useQuery({ queryKey: publicQueryKeys.stats, queryFn: publicApi.getPublicStats });
}

export function useRecentAnnoncesQuery() {
  return useQuery({ queryKey: publicQueryKeys.recentAnnonces, queryFn: publicApi.getRecentAnnonces });
}

export function useVillesQuery() {
  return useQuery({ queryKey: publicQueryKeys.villes, queryFn: publicApi.getVilles, staleTime: 10 * 60 * 1000 });
}

export function useSecteursQuery(params?: SecteurListParams) {
  return useQuery({
    queryKey: publicQueryKeys.secteurs(params),
    queryFn: () => publicApi.getSecteurs(params),
    staleTime: 10 * 60 * 1000,
  });
}

/** Paramètres système exposés publiquement (délais/tolérances affichés côté client), jamais figés côté frontend. */
export function useParametresPubliquesQuery() {
  return useQuery({
    queryKey: publicQueryKeys.parametres,
    queryFn: publicApi.getParametresPublics,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePostContactMutation() {
  return useMutation({ mutationFn: (body: CreateContactRequest) => publicApi.postContact(body) });
}

export function usePostDemandeMutation() {
  return useMutation({ mutationFn: (body: CreateDemandeRequest) => publicApi.postDemande(body) });
}

export function usePostOffreMutation() {
  return useMutation({ mutationFn: (body: CreateOffreRequest) => publicApi.postOffre(body) });
}
