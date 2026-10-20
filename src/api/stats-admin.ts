import { http } from "./http";
import type {
  AdminStatsDTO,
  ApiSuccessResponse,
  BailleurCreancierDTO,
  BailleurTopDTO,
  EvolutionMensuelleDTO,
  FinancesPeriodeDTO,
  GainAgenceDTO,
  LocataireCreanceDTO,
  VilleStatsDTO,
} from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

/** Bornes ISO (aaaa-mm-jj) d'une période ; absentes = depuis le début. */
export interface BornesPeriode {
  debut?: string;
  fin?: string;
}

function params(b?: BornesPeriode) {
  return b?.debut || b?.fin ? { debut: b.debut, fin: b.fin } : undefined;
}

export const statsAdminApi = {
  getStats: () => unwrap<AdminStatsDTO>(http.get("/stats/admin")),
  getVilles: (b?: BornesPeriode) => unwrap<VilleStatsDTO[]>(http.get("/stats/admin/villes", { params: params(b) })),
  getTopBailleurs: (limite = 10) => unwrap<BailleurTopDTO[]>(http.get("/stats/admin/bailleurs/top", { params: { limite } })),
  getLocatairesCreances: () => unwrap<LocataireCreanceDTO[]>(http.get("/stats/admin/locataires/creances")),
  getBailleursCreanciers: () => unwrap<BailleurCreancierDTO[]>(http.get("/stats/admin/bailleurs/creanciers")),
  getGainMensuel: (periode?: string) =>
    unwrap<GainAgenceDTO>(http.get("/stats/admin/gain-mensuel", { params: periode ? { periode } : undefined })),
  getFinances: (b?: BornesPeriode) => unwrap<FinancesPeriodeDTO>(http.get("/stats/admin/finances", { params: params(b) })),
  /** Vide le cache serveur des statistiques (bouton « Actualiser »). */
  viderCache: () => http.post("/stats/admin/cache/vider"),
  getEvolution: (mois = 12) => unwrap<EvolutionMensuelleDTO[]>(http.get("/stats/admin/evolution", { params: { mois } })),
};
