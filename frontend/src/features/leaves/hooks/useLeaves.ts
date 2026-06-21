// ============================================================
// src/features/leaves/hooks/useLeaves.ts
// All React Query hooks for the Leaves module.
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axiosClient";
import type { Leave, LeaveRequest, LeaveActionRequest } from "@/types/models";

// ---- Query keys ----
export const LEAVE_KEYS = {
  mine: ["leaves", "me"] as const,
  team: ["leaves", "team"] as const,
};

// ---- Queries ----

export function useMyLeaves() {
  return useQuery<Leave[]>({
    queryKey: LEAVE_KEYS.mine,
    queryFn: async () => {
      const { data } = await api.get<Leave[]>("/leaves/me");
      return data;
    },
  });
}

export function useTeamLeaves() {
  return useQuery<Leave[]>({
    queryKey: LEAVE_KEYS.team,
    queryFn: async () => {
      const { data } = await api.get<Leave[]>("/leaves/team");
      return data;
    },
  });
}

// ---- Mutations ----

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation<Leave, Error, LeaveRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<Leave>("/leaves/", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Leave request submitted!");
      void qc.invalidateQueries({ queryKey: LEAVE_KEYS.mine });
    },
    onError: (err) => {
      const e = err as unknown as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail ?? "Failed to submit leave request.");
    },
  });
}

export function useLeaveAction() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; body: LeaveActionRequest }>({
    mutationFn: async ({ id, body }) => {
      // Backend expects `approve` as a query param (bool), not a request body
      const approve = body.action === "approve";
      await api.post(`/leaves/${id}/action`, null, {
        params: { approve },
      });
    },
    onSuccess: (_, { body }) => {
      const label = body.action === "approve" ? "approved" : "rejected";
      toast.success(`Leave ${label} successfully.`);
      void qc.invalidateQueries({ queryKey: LEAVE_KEYS.team });
      void qc.invalidateQueries({ queryKey: LEAVE_KEYS.mine });
    },
    onError: () => {
      toast.error("Failed to process leave action.");
    },
  });
}
