export interface CompteursStatut<S extends string> {
  loading: boolean;
  total: number;
  parStatut: Record<S, number>;
}

type ListeHook = (params: never) => { data?: { page: { totalElements: number } } };

/**
 * Compteurs par statut d'une liste paginée côté serveur : un appel d'une ligne par statut (plus un sans filtre pour le total),
 * on ne lit que totalElements. `useListe` est le hook de liste de la page ; `base` reprend ses filtres hors statut (recherche, mandat…).
 * La liste `statuts` doit rester constante entre deux rendus (même nombre d'appels de hooks).
 */
export function useCompteursStatut<S extends string>(
  useListe: ListeHook,
  base: Record<string, unknown>,
  statuts: readonly S[],
  champ = "statut",
): CompteursStatut<S> {
  const appeler = useListe as (params: Record<string, unknown>) => ReturnType<ListeHook>;
  const total = appeler({ ...base, page: 0, size: 1 });
  const resultats = statuts.map((s) => appeler({ ...base, [champ]: s, page: 0, size: 1 }));

  const parStatut = {} as Record<S, number>;
  statuts.forEach((s, i) => {
    parStatut[s] = resultats[i].data?.page.totalElements ?? 0;
  });
  const loading = total.data === undefined || resultats.some((r) => r.data === undefined);
  return { loading, total: total.data?.page.totalElements ?? 0, parStatut };
}

/** Variante côté client pour les listes déjà chargées en entier (espaces bailleur et client) : compte par statut sans requête. */
export function compterParStatut<T extends { statut: string }, S extends string>(items: readonly T[] | undefined, statuts: readonly S[]): CompteursStatut<S> {
  const parStatut = {} as Record<S, number>;
  for (const s of statuts) parStatut[s] = (items ?? []).filter((i) => i.statut === s).length;
  return { loading: items === undefined, total: items?.length ?? 0, parStatut };
}
