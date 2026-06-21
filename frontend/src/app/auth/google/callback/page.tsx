// ============================================================
// src/app/auth/google/callback/page.tsx
// Google OAuth callback handler.
// The backend serves an HTML page that calls:
//   window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, "*")
// This page is the TARGET that receives that postMessage.
// It also handles being opened directly (as the popup).
// ============================================================

"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  useEffect(() => {
    // This page may be the popup itself redirected here,
    // OR an intermediate. The backend's callback HTML sends
    // postMessage to window.opener. We also handle the case
    // where Next.js renders this page as the popup target.
    if (typeof window !== "undefined" && window.opener) {
      window.opener.postMessage(
        { type: "GOOGLE_AUTH_SUCCESS" },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Completing Google sign-in…
        </p>
      </div>
    </div>
  );
}
