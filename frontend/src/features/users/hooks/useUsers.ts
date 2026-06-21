// ============================================================
// src/features/users/hooks/useUsers.ts
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axiosClient";
import type {
  User,
  CreateUserRequest,
  UpdateRoleRequest,
  AssignUserRequest,
  ResetPasswordRequest,
} from "@/types/models";

export const USER_KEYS = {
  all: ["users"] as const,
};

export function useUsers() {
  return useQuery<User[]>({
    queryKey: USER_KEYS.all,
    queryFn: async () => {
      const { data } = await api.get<User[]>("/users/");
      return data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<User, Error, CreateUserRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<User>("/users/", body);
      return data;
    },
    onSuccess: () => {
      toast.success("User created successfully.");
      void qc.invalidateQueries({ queryKey: USER_KEYS.all });
    },
    onError: (err) => {
      const e = err as unknown as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail ?? "Failed to create user.");
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; body: UpdateRoleRequest }>({
    mutationFn: async ({ id, body }) => { await api.patch(`/users/${id}/role`, body); },
    onSuccess: () => { toast.success("Role updated."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to update role."),
  });
}

export function usePromoteToManager() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.patch(`/users/${id}/promote`); },
    onSuccess: () => { toast.success("User promoted to Manager."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to promote user."),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/users/${id}`); },
    onSuccess: () => { toast.success("User deleted."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to delete user."),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.patch(`/users/${id}/deactivate`); },
    onSuccess: () => { toast.success("User deactivated."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to deactivate user."),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.patch(`/users/${id}/activate`); },
    onSuccess: () => { toast.success("User activated."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to activate user."),
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.post(`/auth/users/${id}/unlock`); },
    onSuccess: () => { toast.success("User account unlocked."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to unlock account."),
  });
}

export function useResetUserPassword() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; body: ResetPasswordRequest }>({
    mutationFn: async ({ id, body }) => { await api.patch(`/users/${id}/reset-password`, body); },
    onSuccess: () => { toast.success("Password reset. User will be prompted to change it."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to reset password."),
  });
}

export function useAssignUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; body: AssignUserRequest }>({
    mutationFn: async ({ id, body }) => { await api.patch(`/users/${id}/assign`, body); },
    onSuccess: () => { toast.success("User assigned successfully."); void qc.invalidateQueries({ queryKey: USER_KEYS.all }); },
    onError: () => toast.error("Failed to assign user."),
  });
}
