// ============================================================
// src/features/complaints/hooks/useComplaints.ts
// All React Query hooks for the Complaints module.
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axiosClient";
import type {
  Complaint,
  ComplaintRequest,
  UpdateComplaintRequest,
} from "@/types/models";

export const COMPLAINT_KEYS = {
  mine: ["complaints", "me"] as const,
  all: ["complaints", "all"] as const,
  team: ["complaints", "team"] as const,
  anonymous: ["complaints", "anonymous"] as const,
};

// ---- Queries ----

export function useMyComplaints() {
  return useQuery<Complaint[]>({
    queryKey: COMPLAINT_KEYS.mine,
    queryFn: async () => {
      const { data } = await api.get<Complaint[]>("/complaints/me");
      return data;
    },
  });
}

export function useAllComplaints() {
  return useQuery<Complaint[]>({
    queryKey: COMPLAINT_KEYS.all,
    queryFn: async () => {
      const { data } = await api.get<Complaint[]>("/complaints/");
      return data;
    },
  });
}

export function useTeamComplaints() {
  return useQuery<Complaint[]>({
    queryKey: COMPLAINT_KEYS.team,
    queryFn: async () => {
      const { data } = await api.get<Complaint[]>("/complaints/team");
      return data;
    },
  });
}

// ---- Mutations ----

export function useFileComplaint() {
  const qc = useQueryClient();
  return useMutation<Complaint, Error, ComplaintRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<Complaint>("/complaints/", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Complaint filed successfully.");
      void qc.invalidateQueries({ queryKey: COMPLAINT_KEYS.mine });
    },
    onError: () => toast.error("Failed to file complaint."),
  });
}

export function useResolveComplaint() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; note: string }>({
    mutationFn: async ({ id, note }) => {
      // New backend: PATCH /complaints/{id} with status + resolution_note in body
      await api.patch(`/complaints/${id}`, {
        status: "resolved",
        resolution_note: note,
      });
    },
    onSuccess: () => {
      toast.success("Complaint resolved.");
      void qc.invalidateQueries({ queryKey: COMPLAINT_KEYS.all });
      void qc.invalidateQueries({ queryKey: COMPLAINT_KEYS.team });
      void qc.invalidateQueries({ queryKey: COMPLAINT_KEYS.mine });
    },
    onError: () => toast.error("Failed to resolve complaint."),
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; body: UpdateComplaintRequest }>({
    mutationFn: async ({ id, body }) => {
      await api.patch(`/complaints/${id}`, body);
    },
    onSuccess: () => {
      toast.success("Complaint updated.");
      void qc.invalidateQueries({ queryKey: COMPLAINT_KEYS.all });
    },
    onError: () => toast.error("Failed to update complaint."),
  });
}
