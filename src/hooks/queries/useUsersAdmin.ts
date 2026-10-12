import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAdminApi, type UserListParams } from "@/api/users-admin";
import type { CreateUserByAdminRequest, Role } from "@/api/types";

export function useUsersByRoleQuery(role: Role, params?: UserListParams) {
  return useQuery({
    queryKey: ["admin-users", role, params],
    queryFn: () => usersAdminApi.getByRole(role, params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUserAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserByAdminRequest) => usersAdminApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
