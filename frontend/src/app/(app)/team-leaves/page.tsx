// ============================================================
// src/app/(app)/team-leaves/page.tsx
// Team Leaves — Manager/HR view with approve/reject actions.
// ============================================================

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { useTeamLeaves, useLeaveAction } from "@/features/leaves/hooks/useLeaves";
import type { Leave } from "@/types/models";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function TeamLeaveRow({ leave }: { leave: Leave }) {
  const { mutate: action, isPending } = useLeaveAction();
  const isPending_ = leave.status === "pending";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium">{leave.applicant_name ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{leave.department ?? "—"}</td>
      <td className="px-4 py-3">{leave.leave_type}</td>
      <td className="px-4 py-3 font-medium text-muted-foreground">
        {Math.ceil(Math.abs(new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
      </td>
      <td className="px-4 py-3 text-muted-foreground">{leave.start_date}</td>
      <td className="px-4 py-3 text-muted-foreground">{leave.end_date}</td>
      <td className="px-4 py-3">
        <StatusBadge status={leave.status} />
      </td>
      <td className="px-4 py-3">
        {isPending_ ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
              disabled={isPending}
              onClick={() => action({ id: leave.id, body: { action: "approve" } })}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              disabled={isPending}
              onClick={() => action({ id: leave.id, body: { action: "reject" } })}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {leave.approver_name ? `By ${leave.approver_name}` : "—"}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function TeamLeavesPage() {
  const { data: leaves, isLoading } = useTeamLeaves();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filtered = leaves?.filter((l) => filter === "all" || l.status === filter);

  return (
    <RoleGuard
      allowedRoles={["manager", "hr", "admin"]}
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Team Leaves</h1>
            <p className="text-sm text-muted-foreground">Approve or reject your team&apos;s leave requests</p>
          </div>
          {/* Filter tabs */}
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5 gap-0.5">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-xl overflow-hidden bg-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Employee", "Department", "Type", "Duration", "Start", "End", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered && filtered.length > 0 ? (
                  filtered.map((leave) => (
                    <TeamLeaveRow key={leave.id} leave={leave} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <Users2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No {filter !== "all" ? filter : ""} leave requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </RoleGuard>
  );
}
