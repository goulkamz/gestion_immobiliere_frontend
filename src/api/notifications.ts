import { http } from "./http";
import type { ApiSuccessResponse, NotificationResponse, PageParams, PagedResponse } from "./types";

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data as T;
}

export interface NotificationListParams extends PageParams {
  nonLuesSeulement?: boolean;
}

export const notificationsApi = {
  getAll: (params?: NotificationListParams) =>
    unwrap<PagedResponse<NotificationResponse>>(http.get("/notifications", { params })),
  countNonLues: () => unwrap<{ count: number }>(http.get("/notifications/non-lues/count")),
  marquerLue: (id: number) => unwrap<NotificationResponse>(http.patch(`/notifications/${id}/lue`)),
  marquerToutesLues: () => unwrap<{ count: number }>(http.patch("/notifications/lues")),
};
