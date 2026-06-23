// ============================================================
// src/app/(app)/all-complaints/page.tsx
// HR/Admin complaints resolution dashboard.
// ============================================================

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/guards/RoleGuard";
import {
  useAllComplaints,
  useResolveComplaint,
} from "@/features/complaints/hooks/useComplaints";
import type { Complaint } from "@/types/models";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

function ResolveDialog({
  complaint,
  onClose,
}: {
  complaint: Complaint;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const { mutate, isPending } = useResolveComplaint();

  const handleResolve = () => {
    mutate(
      { id: complaint.id, note: note },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Resolve Complaint</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm font-medium">{complaint.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
            {complaint.description}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resolution-note">Resolution note</Label>
          <Textarea
            id="resolution-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the resolution or actions taken…"
            className="resize-none h-24"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleResolve}
            disabled={isPending || !note.trim()}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Mark as Resolved
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function AllComplaintsPage() {
  const { data: complaints, isLoading } = useAllComplaints();
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = complaints?.filter(
    (c) => filter === "all" || c.status === filter
  );

  return (
    <RoleGuard
      allowedRoles={["hr", "admin"]}
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access restricted to HR and Admin.</p>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">All Complaints</h1>
            <p className="text-sm text-muted-foreground">Review and resolve employee grievances</p>
          </div>
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5 gap-0.5">
            {["all", "open", "under_review", "resolved"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.replace("_", " ")}
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
                  {["Reporter", "Title", "Priority", "Dept", "Status", "Anon", "Filed", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered && filtered.length > 0 ? (
                  filtered.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.is_anonymous ? (
                          <span className="flex items-center gap-1 text-xs italic">
                            <ShieldOff className="w-3 h-3" /> Anonymous
                          </span>
                        ) : (
                          c.reporter_name ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{c.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[c.priority] ?? "bg-muted text-muted-foreground"}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.department ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${c.status === "resolved" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300" : c.status === "open" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.is_anonymous ? <ShieldOff className="w-3.5 h-3.5 text-muted-foreground mx-auto" /> : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {c.status !== "resolved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs gap-1"
                            onClick={() => setSelected(c)}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Resolve
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      No complaints found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <ResolveDialog complaint={selected} onClose={() => setSelected(null)} />
        )}
      </Dialog>
    </RoleGuard>
  );
}
