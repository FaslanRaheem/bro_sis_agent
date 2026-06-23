// ============================================================
// src/components/providers/Providers.tsx
// Client-side providers tree: ThemeProvider + QueryClientProvider.
// ============================================================

"use client";

import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        {children}

      </QueryClientProvider>
    </ThemeProvider>
  );
}
