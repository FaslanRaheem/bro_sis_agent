// ============================================================
// src/components/guards/RoleGuard.tsx
// Renders children only if the current user has one of the
// allowed roles. Optionally renders a fallback instead of null.
// ============================================================

"use client";

import type { Role } from "@/types/models";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  /** Roles that are permitted to see the children */
  allowedRoles: Role[];
  /** Content to show if the role check passes */
  children: React.ReactNode;
  /** Optional fallback when access is denied (default: null) */
  fallback?: React.ReactNode;
}

/**
 * RoleGuard — declarative RBAC wrapper.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['admin']}>
 *     <AdminPanel />
 *   </RoleGuard>
 *
 *   <RoleGuard allowedRoles={['hr', 'admin']} fallback={<AccessDenied />}>
 *     <DocumentUpload />
 *   </RoleGuard>
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;
  if (!hasRole(allowedRoles)) return <>{fallback}</>;

  return <>{children}</>;
}
