// ============================================================
// src/features/documents/hooks/useDocuments.ts
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axiosClient";
import type { Document, DocumentUploadResponse, DocumentViewResponse } from "@/types/models";

export const DOCUMENT_KEYS = {
  all: ["documents"] as const,
};

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: DOCUMENT_KEYS.all,
    queryFn: async () => {
      const { data } = await api.get<Document[]>("/documents/");
      return data;
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation<DocumentUploadResponse, Error, FormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post<DocumentUploadResponse>(
        "/documents/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message ?? "Document uploaded successfully.");
      void qc.invalidateQueries({ queryKey: DOCUMENT_KEYS.all });
    },
    onError: () => toast.error("Upload failed. Ensure the file is a valid PDF."),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      toast.success("Document deleted.");
      void qc.invalidateQueries({ queryKey: DOCUMENT_KEYS.all });
    },
    onError: () => toast.error("Failed to delete document."),
  });
}

export function useViewDocument() {
  return useMutation<string, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.get<DocumentViewResponse>(`/documents/${id}/view`);
      return data.url;
    },
    onError: () => toast.error("Failed to get document preview URL."),
  });
}
