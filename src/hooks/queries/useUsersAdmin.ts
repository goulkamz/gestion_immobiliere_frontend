import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAdminApi, type UserListParams } from "@/api/users-admin";
import type { CreateUserByAdminRequest, Role } from "@/api/types";

export function useUsersByRoleQuery(role: Role | undefined, params?: UserListParams) {
  return useQuery({
    queryKey: ["admin-users", role, params],
    queryFn: () => usersAdminApi.getByRole(role, params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flagActif }: { id: number; flagActif: boolean }) => usersAdminApi.updateStatus(id, flagActif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useRestaurerUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersAdminApi.restaurer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useCreateUserAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserByAdminRequest) => usersAdminApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
