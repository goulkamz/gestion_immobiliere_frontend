import { http } from "./http";
import type { ApiSuccessResponse, ContactResponse, PageParams, PagedResponse, StatutContact, UpdateStatutContactRequest } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface ContactListParams extends PageParams {
  /** Recherche serveur (nom, email, sujet, message). */
  recherche?: string;
  statut?: StatutContact;
}

export const contactsApi = {
  getContacts: (params?: ContactListParams) => unwrap<PagedResponse<ContactResponse>>(http.get("/contacts", { params })),
  getContact: (id: number) => unwrap<ContactResponse>(http.get(`/contacts/${id}`)),
  updateStatut: (id: number, body: UpdateStatutContactRequest) => unwrap<ContactResponse>(http.patch(`/contacts/${id}/statut`, body)),
};
