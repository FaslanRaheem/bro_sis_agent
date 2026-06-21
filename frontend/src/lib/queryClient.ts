// ============================================================
// src/lib/queryClient.ts
// TanStack React Query v5 — shared QueryClient configuration.
// ============================================================

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 60 seconds — avoids redundant refetches
      staleTime: 60 * 1000,
      // Retry once on network-level failures; don't retry auth/business errors
      retry: (failureCount, error) => {
        const axiosError = error as { response?: { status: number } };
        const status = axiosError?.response?.status;
        // Never retry 401, 403, 404, 422
        if (status && [401, 403, 404, 422].includes(status)) return false;
        return failureCount < 1;
      },
      // Refetch when the window regains focus (user switches tabs and comes back)
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Don't retry failed mutations
      retry: false,
    },
  },
});
