import { useMemo } from "react";
import { useAdminEvolutionQuery } from "@/hooks/queries/useStatsAdmin";

const moisCourtFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

export const DUREES_EVOLUTION = [6, 12, 24] as const;

export interface PointEvolution {
  libelle: string;
  "Loyers encaissés": number;
  "Reversements effectués": number;
  "Commissions acquises": number;
  "Volume encaissé": number;
  "Revenu agence": number;
  Inscriptions: number;
  "Nouveaux contrats": number;
}

/** Série mensuelle prête pour les graphiques (libellés de mois courts, clés lisibles dans les légendes). */
export function useSerieEvolution(nbMois: number): { points: PointEvolution[]; isLoading: boolean } {
  const query = useAdminEvolutionQuery(nbMois);
  const points = useMemo(
    () =>
      (query.data ?? []).map((e) => {
        const d = new Date(e.mois);
        return {
          libelle: nbMois > 12 ? `${moisCourtFormatter.format(d)} ${String(d.getFullYear()).slice(2)}` : moisCourtFormatter.format(d),
          "Loyers encaissés": e.loyersEncaisses,
          "Reversements effectués": e.reversementsEffectues,
          "Commissions acquises": e.commissionsAcquises,
          "Volume encaissé": e.loyersEncaisses + e.biensServicesNet,
          "Revenu agence": e.commissionsAcquises + e.biensServicesNet,
          Inscriptions: e.inscriptions,
          "Nouveaux contrats": e.nouveauxContrats,
        };
      }),
    [query.data, nbMois],
  );
  return { points, isLoading: query.isLoading };
}
