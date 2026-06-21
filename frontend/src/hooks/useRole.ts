// ============================================================
// src/hooks/useRole.ts
// Convenience destructured role flags built on top of useAuth.
// ============================================================

import { useAuth } from "@/hooks/useAuth";

export function useRole() {
  const { user, hasRole } = useAuth();

  return {
    /** Raw role string */
    role: user?.role ?? null,
    /** true for admin only */
    isAdmin: hasRole(["admin"]),
    /** true for hr or admin */
    isHR: hasRole(["hr", "admin"]),
    /** true for manager, hr, or admin */
    isManager: hasRole(["manager", "hr", "admin"]),
    /** true for any authenticated user (all roles) */
    isEmployee: !!user,
  };
}
