// ============================================================
// src/hooks/useAuth.ts
// Composable hook wrapping the Zustand auth store.
// Provides: user, token, isAuthenticated, and hasRole() helper.
// ============================================================

import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types/models";

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, setUser } =
    useAuthStore();

  /**
   * Returns true if the current user's role is one of the allowed roles.
   * Always returns false when not authenticated.
   *
   * @example
   *   const { hasRole } = useAuth();
   *   if (hasRole(['hr', 'admin'])) { ... }
   */
  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setUser,
    hasRole,
  };
}
