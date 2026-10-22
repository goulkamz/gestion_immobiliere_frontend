import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parametresAdminApi } from "@/api/parametres-admin";

export function useParametresAdminQuery() {
  return useQuery({ queryKey: ["parametres", "admin"], queryFn: parametresAdminApi.getAll });
}

export function useUpdateParametreMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cle, valeur }: { cle: string; valeur: string }) => parametresAdminApi.update(cle, valeur),
    // Les paramètres publics (tolérance, délai de réservation) alimentent des messages du site : on les rafraîchit aussi
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: ["parametres"] }), queryClient.invalidateQueries({ queryKey: ["public", "parametres"] })]),
  });
}
