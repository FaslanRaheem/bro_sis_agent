// ============================================================
// src/app/(app)/chat/page.tsx
// AI Chat interface — session sidebar + message thread.
// ============================================================

"use client";

import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Send,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useChatSessions,
  useSessionMessages,
  useCreateSession,
  useSendMessage,
  useSubmitFeedback,
} from "@/features/chat/hooks/useChat";
import type { ChatMessage } from "@/types/models";
import { format } from "date-fns";

// ---- Typing indicator ----
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

// ---- Message bubble ----
function MessageBubble({
  message,
  onFeedback,
  onGoogleConnect,
}: {
  message: ChatMessage & { requiresGoogleAuth?: boolean };
  onFeedback: (id: string, feedback: "thumbs_up" | "thumbs_down") => void;
  onGoogleConnect: () => void;
}) {
  const isUser = message.role === "user";
  const [given, setGiven] = useState<"thumbs_up" | "thumbs_down" | null>(null);

  // Sanitize AI content before rendering
  const safeContent = DOMPurify.sanitize(message.content);

  return (
    <motion.div
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-secondary" : "bg-primary"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-secondary-foreground" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-primary-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {/* dangerouslySetInnerHTML is safe here because we run DOMPurify first */}
          <div dangerouslySetInnerHTML={{ __html: safeContent }} />

          {/* Google Auth Connect Button — shown when AI needs Gmail access */}
          {!isUser && message.requiresGoogleAuth && (
            <div className="mt-4 pt-3 border-t border-border">
              <button
                onClick={onGoogleConnect}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Connect with Google
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
              <p className="text-[10px] text-muted-foreground mt-1.5">Click above to grant Gmail access and resume your request.</p>
            </div>
          )}
        </div>

        {/* Timestamp + feedback (AI only) */}
        <div className={cn("flex items-center gap-2", isUser && "justify-end")}>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {!isUser && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (given) return;
                  setGiven("thumbs_up");
                  onFeedback(message.id, "thumbs_up");
                }}
                aria-label="Helpful"
                className={cn(
                  "p-1 rounded transition-colors",
                  given === "thumbs_up"
                    ? "text-green-500"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (given) return;
                  setGiven("thumbs_down");
                  onFeedback(message.id, "thumbs_down");
                }}
                aria-label="Not helpful"
                className={cn(
                  "p-1 rounded transition-colors",
                  given === "thumbs_down"
                    ? "text-red-500"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Extended message type with Google auth flag
type ExtendedChatMessage = ChatMessage & { requiresGoogleAuth?: boolean };

// ---- Main chat page ----
export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ExtendedChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: messages, isLoading: messagesLoading } =
    useSessionMessages(activeSessionId);
  const createSession = useCreateSession();
  const sendMessage = useSendMessage();
  const submitFeedback = useSubmitFeedback();

  // ---- Google OAuth popup flow ----
  const handleGoogleConnect = async () => {
    try {
      const { default: api } = await import("@/lib/axiosClient");
      const response = await api.get("/auth/google/login");
      const authUrl = response.data.auth_url;
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(authUrl, "Google OAuth", `width=${width},height=${height},left=${left},top=${top}`);
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
    }
  };

  // Listen for OAuth success from popup and resume the chat
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        void handleSendWithContent("Gmail connected. Please proceed and submit my leave request now.");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, optimisticMessages, isTyping]);

  const handleNewSession = async () => {
    const session = await createSession.mutateAsync({});
    setActiveSessionId(session.id);
    setOptimisticMessages([]);
  };

  // Core send logic — accepts content directly so it can be called
  // both from the textarea and from the Google OAuth resume handler
  const handleSendWithContent = async (content: string) => {
    if (!content.trim() || !activeSessionId) return;

    // Optimistic user message
    const optimisticMsg: ExtendedChatMessage = {
      id: `opt-${Date.now()}`,
      session_id: activeSessionId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    setIsTyping(true);

    try {
      const data = await sendMessage.mutateAsync({
        session_id: activeSessionId,
        role: "user",
        content,
      });

      // Detect GOOGLE_AUTH_REQUIRED signal in AI response
      if ((data as any)?.content?.includes("GOOGLE_AUTH_REQUIRED")) {
        const authMsg: ExtendedChatMessage = {
          id: `auth-${Date.now()}`,
          session_id: activeSessionId,
          role: "assistant",
          content: "To proceed, I need secure access to your Google account. Please click the button below to connect your Gmail account. Once connected, your request will automatically resume.",
          created_at: new Date().toISOString(),
          requiresGoogleAuth: true,
        };
        setOptimisticMessages((prev) => [...prev.filter(m => !m.id.startsWith("opt-")), authMsg]);
        return;
      }
    } finally {
      setIsTyping(false);
      // Clear optimistic messages (real ones come from the query)
      setOptimisticMessages((prev) => prev.filter(m => m.requiresGoogleAuth));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSessionId) return;
    const userContent = input.trim();
    setInput("");
    await handleSendWithContent(userContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFeedback = (
    messageId: string,
    feedback: "thumbs_up" | "thumbs_down"
  ) => {
    submitFeedback.mutate({ messageId, body: { feedback } });
  };

  // Combine real + optimistic messages
  const displayMessages = [
    ...(messages ?? []),
    ...optimisticMessages.filter(
      (om) => !messages?.some((m) => m.content === om.content)
    ),
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] max-h-[900px] border border-border rounded-xl overflow-hidden bg-card">
      {/* Session sidebar */}
      <div className="w-56 shrink-0 flex flex-col border-r border-border">
        <div className="p-3 border-b border-border">
          <Button
            size="sm"
            className="w-full gap-2 h-8 text-xs"
            onClick={handleNewSession}
            disabled={createSession.isPending}
          >
            {createSession.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {sessionsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))
            ) : sessions && sessions.length > 0 ? (
              sessions
                .slice()
                .reverse()
                .map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setOptimisticMessages([]);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors",
                      activeSessionId === session.id
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {format(new Date(session.created_at), "MMM d, HH:mm")}
                    </span>
                  </button>
                ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No sessions yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeSessionId ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex gap-3",
                          i % 2 === 0 ? "flex-row-reverse" : ""
                        )}
                      >
                        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                        <Skeleton
                          className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {displayMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        onFeedback={handleFeedback}
                        onGoogleConnect={handleGoogleConnect}
                      />
                    ))}
                    {isTyping && <TypingIndicator />}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="max-w-2xl mx-auto flex gap-3 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about HR policies, leave balances, procedures…"
                  className="resize-none min-h-[44px] max-h-32 text-sm"
                  rows={1}
                  disabled={sendMessage.isPending}
                  aria-label="Message input"
                />
                <Button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || sendMessage.isPending}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Send message"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">AI HR Assistant</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Ask questions about HR policies, leave procedures, and company
                guidelines powered by RAG.
              </p>
            </div>
            <Button onClick={handleNewSession} disabled={createSession.isPending} className="gap-2">
              {createSession.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Start a new chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
