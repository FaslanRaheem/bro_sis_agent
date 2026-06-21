// ============================================================
// src/store/authStore.ts
// Zustand auth store — holds JWT token + user profile in memory
// and syncs to sessionStorage (cleared on tab close, safer than
// localStorage against persistent XSS).
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/models";

interface AuthState {
  /** JWT access token — kept in sessionStorage */
  token: string | null;
  /** Decoded / fetched user profile */
  user: User | null;
  /** Derived convenience flag */
  isAuthenticated: boolean;

  // ---- Actions ----
  /** Called after a successful login */
  login: (token: string, user: User) => void;
  /** Called on logout or 401 intercept */
  logout: () => void;
  /** Update the stored user profile (e.g., after /auth/me refresh) */
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "hr-auth", // key in sessionStorage
      storage: createJSONStorage(() => sessionStorage),
      // Only persist token + user — isAuthenticated is derived
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
