import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

interface Options<T> {
  /** Lignes de la page affichée. */
  rows: T[];
  getId: (row: T) => number;
  /** Récupère une ligne par son identifiant (utilisé si elle n'est pas dans la page affichée). */
  fetchOne: (id: number) => Promise<T>;
  /** Préfixe de clé de cache de la ressource. */
  queryKey: readonly unknown[];
}

/**
 * Ligne ciblée par une notification (`?cible=<id>` dans l'adresse).
 * - si la ligne est dans la page affichée, elle est simplement repérée ;
 * - sinon (autre page, filtre actif) elle est récupérée par son identifiant et épinglée en tête du tableau,
 *   pour qu'elle soit toujours visible quelle que soit la pagination.
 * Le repère reste tant que le paramètre est dans l'adresse ; `effacer` le retire.
 */
export function useLigneCiblee<T>({ rows, getId, fetchOne, queryKey }: Options<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const brut = searchParams.get("cible");
  const cibleId = brut !== null && /^\d+$/.test(brut) ? Number(brut) : null;

  const dansLaPage = cibleId !== null && rows.some((row) => getId(row) === cibleId);
  const ligneQuery = useQuery({
    queryKey: [...queryKey, "cible", cibleId],
    queryFn: () => fetchOne(cibleId as number),
    enabled: cibleId !== null && !dansLaPage,
    retry: false,
  });

  const data = cibleId !== null && !dansLaPage && ligneQuery.data ? [ligneQuery.data, ...rows] : rows;

  function effacer() {
    const suivants = new URLSearchParams(searchParams);
    suivants.delete("cible");
    setSearchParams(suivants, { replace: true });
  }

  return { data, cibleId, effacer };
}
