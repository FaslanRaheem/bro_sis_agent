// ============================================================
// src/app/(auth)/layout.tsx
// BROSIS auth layout — full-screen dark base for animated pages
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | BROSIS",
  description: "Sign in to your BROSIS workspace — Agentic AI for the Workplace.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="min-h-screen w-full overflow-hidden"
      style={{ background: "oklch(0.07 0.02 240)" }}
    >
      {children}
    </main>
  );
}
