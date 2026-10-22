import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  localisationApi,
  type PaysBody,
  type SecteurAdminListParams,
  type SecteurBody,
  type VilleAdminListParams,
  type VilleBody,
} from "@/api/localisation";

const PAGE_COMPLETE = { page: 0, size: 100 };

export function usePaysAdminQuery() {
  return useQuery({ queryKey: ["localisation", "pays"], queryFn: () => localisationApi.getPays({ ...PAGE_COMPLETE, sort: "nomPays,asc" }) });
}

export function useVillesAdminQuery(params?: VilleAdminListParams) {
  return useQuery({
    queryKey: ["localisation", "villes", params],
    queryFn: () => localisationApi.getVilles({ ...PAGE_COMPLETE, sort: "nomVille,asc", ...params }),
    placeholderData: keepPreviousData,
  });
}

export function useSecteursAdminQuery(params?: SecteurAdminListParams) {
  return useQuery({
    queryKey: ["localisation", "secteurs", params],
    queryFn: () => localisationApi.getSecteurs({ sort: "nomSecteur,asc", ...params }),
    placeholderData: keepPreviousData,
  });
}

/** Les listes publiques (formulaires, filtres) et les listes admin partagent les mêmes données : on invalide les deux. */
function useInvalidateLocalisation() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["localisation"] }),
      queryClient.invalidateQueries({ queryKey: ["public"] }),
    ]);
}

export function usePaysMutations() {
  const invalider = useInvalidateLocalisation();
  const options = { onSuccess: invalider };
  return {
    create: useMutation({ mutationFn: (body: PaysBody) => localisationApi.createPays(body), ...options }),
    update: useMutation({ mutationFn: ({ id, body }: { id: number; body: PaysBody }) => localisationApi.updatePays(id, body), ...options }),
    remove: useMutation({ mutationFn: (id: number) => localisationApi.removePays(id), ...options }),
  };
}

export function useVillesMutations() {
  const invalider = useInvalidateLocalisation();
  const options = { onSuccess: invalider };
  return {
    create: useMutation({ mutationFn: (body: VilleBody) => localisationApi.createVille(body), ...options }),
    update: useMutation({ mutationFn: ({ id, body }: { id: number; body: VilleBody }) => localisationApi.updateVille(id, body), ...options }),
    remove: useMutation({ mutationFn: (id: number) => localisationApi.removeVille(id), ...options }),
  };
}

export function useSecteursMutations() {
  const invalider = useInvalidateLocalisation();
  const options = { onSuccess: invalider };
  return {
    create: useMutation({ mutationFn: (body: SecteurBody) => localisationApi.createSecteur(body), ...options }),
    update: useMutation({ mutationFn: ({ id, body }: { id: number; body: SecteurBody }) => localisationApi.updateSecteur(id, body), ...options }),
    remove: useMutation({ mutationFn: (id: number) => localisationApi.removeSecteur(id), ...options }),
  };
}
