import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactsApi, type ContactListParams } from "@/api/contacts";
import type { UpdateStatutContactRequest } from "@/api/types";

export const contactsQueryKeys = {
  list: (params?: ContactListParams) => ["contacts", params] as const,
};

export function useContactsQuery(params?: ContactListParams) {
  return useQuery({ queryKey: contactsQueryKeys.list(params), queryFn: () => contactsApi.getContacts(params), placeholderData: keepPreviousData });
}

export function useUpdateStatutContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateStatutContactRequest }) => contactsApi.updateStatut(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}
