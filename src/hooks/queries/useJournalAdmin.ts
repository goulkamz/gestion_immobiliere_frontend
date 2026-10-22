import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { journalApi, type JournalListParams } from "@/api/journal";

export function useJournalQuery(params: JournalListParams) {
  return useQuery({ queryKey: ["journal", params], queryFn: () => journalApi.getJournaux(params), placeholderData: keepPreviousData });
}

export function useJournalEntitesQuery() {
  return useQuery({ queryKey: ["journal", "entites"], queryFn: journalApi.getEntites, staleTime: 5 * 60 * 1000 });
}
