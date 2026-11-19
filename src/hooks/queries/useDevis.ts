import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { devisApi, type DevisListParams } from "@/api/devis";
import type { AccordHorsPlateformeRequest, CreateDevisRequest, UpdateDevisRequest } from "@/api/types";

export function useDevisQuery(params?: DevisListParams) {
  return useQuery({
    queryKey: ["devis", params] as const,
    queryFn: () => devisApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Toute action sur un devis rafraîchit les listes de devis ; l'enregistrement d'une dépense rafraîchit aussi les dépenses. */
function useDevisMutation<V, R = unknown>(mutationFn: (variables: V) => Promise<R>, avecDepenses = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      if (avecDepenses) queryClient.invalidateQueries({ queryKey: ["depenses"] });
    },
  });
}

export function useCreateDevisMutation() {
  return useDevisMutation((body: CreateDevisRequest) => devisApi.create(body));
}

export function useUpdateDevisMutation() {
  return useDevisMutation(({ id, body }: { id: number; body: UpdateDevisRequest }) => devisApi.update(id, body));
}

export function useAnnulerDevisMutation() {
  return useDevisMutation(({ id, commentaire }: { id: number; commentaire: string }) => devisApi.annuler(id, commentaire));
}

export function useEnregistrerDepenseDevisMutation() {
  return useDevisMutation(
    ({ id, body }: { id: number; body: { dateDepense?: string; montant?: number } }) => devisApi.enregistrerDepense(id, body),
    true,
  );
}

export function useAccordHorsPlateformeMutation() {
  return useDevisMutation(({ id, body }: { id: number; body: AccordHorsPlateformeRequest }) => devisApi.accordHorsPlateforme(id, body));
}

export function useJoindrePieceJointeMutation() {
  return useDevisMutation(({ id, fichier }: { id: number; fichier: File }) => devisApi.joindrePieceJointe(id, fichier));
}

export function useRetirerPieceJointeMutation() {
  return useDevisMutation((id: number) => devisApi.retirerPieceJointe(id));
}

export function useContesterAccordMutation() {
  return useDevisMutation(({ id, commentaire }: { id: number; commentaire: string }) => devisApi.contesterAccord(id, commentaire));
}

export function useAccepterDevisMutation() {
  return useDevisMutation(({ id, montant, nombreMois }: { id: number; montant: number; nombreMois: number }) =>
    devisApi.accepter(id, { montant, nombreMois }),
  );
}

export function useRenegocierDevisMutation() {
  return useDevisMutation(({ id, commentaire }: { id: number; commentaire: string }) => devisApi.renegocier(id, commentaire));
}

export function useRejeterDevisMutation() {
  return useDevisMutation(({ id, commentaire }: { id: number; commentaire: string }) => devisApi.rejeter(id, commentaire));
}
