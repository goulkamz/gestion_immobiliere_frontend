import { http } from "./http";
import type { ApiSuccessResponse, PageParams, PagedResponse } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export type ActionJournal = "CREATE" | "UPDATE" | "DELETE";

export interface JournalResponse {
  idJournal: number;
  idUser: number | null;
  /** « Prénom Nom » ; null si le compte n'existe plus. */
  auteur: string | null;
  action: ActionJournal | string;
  entite: string;
  ligneEntite: number | null;
  description: string | null;
  dateAction: string;
  /** JSON sérialisé des champs avant modification (UPDATE, DELETE). */
  ancienContenu: string | null;
  /** JSON sérialisé des champs après modification (CREATE, UPDATE). */
  nouveauContenu: string | null;
}

export interface JournalListParams extends PageParams {
  idUser?: number;
  action?: string;
  entite?: string;
  /** Dates ISO (AAAA-MM-JJ), bornes incluses. */
  dateDebut?: string;
  dateFin?: string;
}

/** Piste d'audit, réservée à ROLE_ADMIN. */
export const journalApi = {
  getJournaux: (params?: JournalListParams) => unwrap<PagedResponse<JournalResponse>>(http.get("/journaux", { params })),
  getEntites: () => unwrap<string[]>(http.get("/journaux/entites")),
};
