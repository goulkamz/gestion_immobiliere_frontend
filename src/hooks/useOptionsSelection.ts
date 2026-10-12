import type { RemoteComboboxResult } from "@/components/ui";
import { useCategoriesQuery } from "@/hooks/queries/useCategories";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useBiensServicesQuery, useMaisonsQuery, useSecteursQuery } from "@/hooks/queries/usePublicCatalog";
import { useUsersByRoleQuery } from "@/hooks/queries/useUsersAdmin";

/**
 * Hooks à passer à `RemoteCombobox` (`useOptions`) : 20 premiers résultats du serveur pour le texte saisi.
 * Les fonctions sont définies ici, une fois, pour rester identiques d'un rendu à l'autre (règle des hooks).
 */
const TAILLE = 20;

export function useClientsOptions(recherche: string): RemoteComboboxResult {
  const query = useUsersByRoleQuery("ROLE_CLIENT", {
    size: TAILLE,
    sort: "nom,asc",
    recherche: recherche || undefined,
  });
  return {
    options: (query.data?.content ?? []).map((u) => ({
      value: u.idUser,
      label: `${u.nom} ${u.prenom} (${u.email})`,
    })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

export function useBiensServicesDisponiblesOptions(recherche: string): RemoteComboboxResult {
  const query = useBiensServicesQuery({
    size: TAILLE,
    sort: "libelle,asc",
    disponibilite: "DISPONIBLE",
    recherche: recherche || undefined,
  });
  return {
    options: (query.data?.content ?? []).map((b) => ({ value: b.idBienService, label: b.libelle })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

/** Catalogue des maisons réservables : disponibles et dont la cour a un mandat actif. */
export function useMaisonsDisponiblesOptions(recherche: string): RemoteComboboxResult {
  const query = useMaisonsQuery({
    statut: "DISPONIBLE",
    size: TAILLE,
    sort: "nomCommunMaison,asc",
    recherche: recherche || undefined,
  });
  return {
    options: (query.data?.content ?? []).map((m) => ({
      value: m.idMaison,
      label: m.nomCommunMaison ?? `Maison #${m.idMaison}`,
    })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

/** Mandats actifs, identifiés par leur id (reversements). */
export function useMandatsActifsOptions(recherche: string): RemoteComboboxResult {
  const query = useContratsMandatQuery({ statut: "ACTIF", size: TAILLE, recherche: recherche || undefined });
  return {
    options: (query.data?.content ?? []).map((m) => ({ value: m.idMandat, label: m.referenceCour })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

/** Cours (création d'une maison), libellées avec leur référence et leur propriétaire. */
export function useCoursOptions(recherche: string): RemoteComboboxResult {
  const query = useCoursQuery({ size: TAILLE, recherche: recherche || undefined });
  return {
    options: (query.data?.content ?? []).map((c) => ({
      value: c.idCour,
      label: `${c.referenceCour} (${c.nomProprietaire})`,
    })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

/** Références de cour ayant un mandat (filtre des échéances de mandat) ; une cour peut avoir plusieurs mandats. */
export function useCoursAvecMandatOptions(recherche: string): RemoteComboboxResult {
  const query = useContratsMandatQuery({ size: TAILLE, recherche: recherche || undefined });
  const references = Array.from(new Set((query.data?.content ?? []).map((m) => m.referenceCour)));
  return {
    options: references.map((ref) => ({ value: ref, label: ref })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

/** Cours sans mandat actif (création d'un mandat : un second mandat actif serait refusé à l'activation). */
export function useCoursSansMandatActifOptions(recherche: string): RemoteComboboxResult {
  const query = useCoursQuery({ size: TAILLE, sansMandatActif: true, recherche: recherche || undefined });
  return {
    options: (query.data?.content ?? []).map((c) => ({
      value: c.idCour,
      label: `${c.referenceCour} (${c.nomProprietaire})`,
    })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

function useUtilisateursOptions(role: "ROLE_BAILLEUR" | "ROLE_AGENT", recherche: string): RemoteComboboxResult {
  const query = useUsersByRoleQuery(role, { size: TAILLE, sort: "nom,asc", recherche: recherche || undefined });
  return {
    options: (query.data?.content ?? []).map((u) => ({
      value: u.idUser,
      label: `${u.prenom} ${u.nom} - ${u.email}`,
    })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

/** Bailleurs (propriétaire d'une cour). */
export function useBailleursOptions(recherche: string): RemoteComboboxResult {
  return useUtilisateursOptions("ROLE_BAILLEUR", recherche);
}

/** Agents (gestionnaire d'un bien ou service). */
export function useGestionnairesOptions(recherche: string): RemoteComboboxResult {
  return useUtilisateursOptions("ROLE_AGENT", recherche);
}

export function useCategoriesOptions(recherche: string): RemoteComboboxResult {
  const query = useCategoriesQuery({ size: TAILLE, sort: "libelle,asc", recherche: recherche || undefined });
  return {
    options: (query.data?.content ?? []).map((c) => ({ value: c.idCategorie, label: c.libelle })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}

export function useSecteursOptions(recherche: string): RemoteComboboxResult {
  const query = useSecteursQuery({ size: TAILLE, sort: "nomSecteur,asc", recherche: recherche || undefined });
  return {
    options: (query.data?.content ?? []).map((s) => ({
      value: s.idSecteur,
      label: `${s.nomSecteur} - ${s.nomVille}`,
    })),
    total: query.data?.page.totalElements,
    isFetching: query.isFetching,
  };
}
