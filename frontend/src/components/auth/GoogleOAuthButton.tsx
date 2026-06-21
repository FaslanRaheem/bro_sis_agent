// ============================================================
// src/components/auth/GoogleOAuthButton.tsx
// "Connect Gmail" button for HR/Admin users.
// Opens a popup, listens for postMessage, closes it on success.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api from "@/lib/axiosClient";
import { useAuthStore } from "@/store/authStore";
import type { GoogleAuthUrlResponse, User } from "@/types/models";

export function GoogleOAuthButton() {
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Message handler — must be stable across renders
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      // Only trust messages from our own origin
      if (event.origin !== window.location.origin) return;

      if (
        event.data &&
        typeof event.data === "object" &&
        event.data.type === "GOOGLE_AUTH_SUCCESS"
      ) {
        setIsLoading(false);
        setIsConnected(true);
        toast.success("Gmail connected successfully!");

        // Refresh user profile to reflect google_access_token
        try {
          const { data: user } = await api.get<User>("/auth/me");
          setUser(user);
        } catch {
          // Non-critical — connection still succeeded
        }
      }
    },
    [setUser]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<GoogleAuthUrlResponse>(
        "/auth/google/login"
      );
      // Open the Google consent screen in a popup
      const popup = window.open(
        data.auth_url,
        "google-oauth",
        "width=500,height=600,left=400,top=200"
      );
      if (!popup) {
        toast.error("Popup was blocked. Please allow popups for this site.");
        setIsLoading(false);
        return;
      }
      // Detect if user closes popup without completing OAuth
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 500);
    } catch {
      toast.error("Failed to start Google authentication.");
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        Gmail Connected
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Globe className="w-4 h-4" />
      )}
      {isLoading ? "Connecting…" : "Connect Gmail"}
    </Button>
  );
}
