import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/store/sessionStore";
import { notificationsApi, type NotificationListParams } from "@/api/notifications";

// Clés propres à l'utilisateur connecté : le cache d'un compte n'est jamais servi à un autre sur le même navigateur.
export const notificationQueryKeys = {
  root: ["notifications"] as const,
  all: (idUser?: number) => ["notifications", idUser] as const,
  count: (idUser?: number) => ["notifications", idUser, "count"] as const,
  list: (idUser?: number, params?: NotificationListParams) => ["notifications", idUser, "list", params] as const,
};

const useIdUser = () => useSessionStore((s) => s.profile?.idUser);

/** Compteur de la cloche : relu toutes les 20 secondes, et au retour sur l'onglet, tant que l'utilisateur est connecté. */
export function useNotificationCountQuery(enabled: boolean) {
  const idUser = useIdUser();
  return useQuery({
    queryKey: notificationQueryKeys.count(idUser),
    queryFn: notificationsApi.countNonLues,
    enabled,
    refetchInterval: 20_000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    select: (data) => data.count,
  });
}

export function useNotificationsQuery(params: NotificationListParams | undefined, enabled: boolean) {
  const idUser = useIdUser();
  return useQuery({
    queryKey: notificationQueryKeys.list(idUser, params),
    queryFn: () => notificationsApi.getAll(params),
    enabled,
    // Toujours relue à l'ouverture du panneau : une liste gardée en cache (30 s par défaut) masquerait les alertes récentes
    staleTime: 0,
  });
}

export function useMarquerNotificationLueMutation() {
  const queryClient = useQueryClient();
  const idUser = useIdUser();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.marquerLue(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all(idUser) }),
  });
}

export function useMarquerToutesNotificationsLuesMutation() {
  const queryClient = useQueryClient();
  const idUser = useIdUser();
  return useMutation({
    mutationFn: notificationsApi.marquerToutesLues,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all(idUser) }),
  });
}
