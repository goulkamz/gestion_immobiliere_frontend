import { useEffect, useState } from "react";

/**
 * État commun des listes paginées côté serveur : texte saisi, texte envoyé au serveur
 * (après 300 ms sans frappe) et page courante, remise à 0 à chaque nouvelle recherche.
 */
export function useRechercheServeur(initial = "") {
  const [search, setSearch] = useState(initial);
  const [recherche, setRecherche] = useState(initial.trim());
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecherche(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return { search, setSearch, recherche, page, setPage };
}
