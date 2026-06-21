// ============================================================
// src/features/chat/hooks/useChat.ts
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axiosClient";
import type {
  ChatSession,
  ChatMessage,
  CreateSessionRequest,
  SendMessageRequest,
  FeedbackRequest,
} from "@/types/models";

export const CHAT_KEYS = {
  sessions: ["chat", "sessions"] as const,
  messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
};

// ---- Queries ----

export function useChatSessions() {
  return useQuery<ChatSession[]>({
    queryKey: CHAT_KEYS.sessions,
    queryFn: async () => {
      const { data } = await api.get<ChatSession[]>("/ai/sessions");
      return data;
    },
  });
}

export function useSessionMessages(sessionId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: CHAT_KEYS.messages(sessionId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<ChatMessage[]>(
        `/ai/sessions/${sessionId}/messages`
      );
      return data;
    },
    enabled: !!sessionId,
  });
}

// ---- Mutations ----

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation<ChatSession, Error, CreateSessionRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<ChatSession>("/ai/sessions", body);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CHAT_KEYS.sessions });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<ChatMessage, Error, SendMessageRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<ChatMessage>("/ai/messages", body);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate the session's message list so it refetches fresh data
      void qc.invalidateQueries({
        queryKey: CHAT_KEYS.messages(data.session_id),
      });
    },
    onError: (err) => {
      const e = err as unknown as { response?: { data?: { detail?: string }; status?: number } };
      if (e?.response?.status === 400) {
        toast.error("Message blocked: Security policy violation detected.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    },
  });
}

export function useSubmitFeedback() {
  return useMutation<void, Error, { messageId: string; body: FeedbackRequest }>({
    mutationFn: async ({ messageId, body }) => {
      await api.post(`/ai/messages/${messageId}/feedback`, body);
    },
    onSuccess: () => {
      toast.success("Feedback submitted. Thank you!");
    },
  });
}
