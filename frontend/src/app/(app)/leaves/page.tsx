// ============================================================
// src/app/(app)/leaves/page.tsx
// Employee Leave Management — apply + view own leaves.
// ============================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { motion } from "framer-motion";
import { Plus, CalendarDays, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyLeaves, useApplyLeave } from "@/features/leaves/hooks/useLeaves";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosClient";
import type { User } from "@/types/models";

// ---- Schema ----
const today = format(new Date(), "yyyy-MM-dd");
// Annual leave must be at least 14 days in advance
const minAnnualDate = format(addDays(new Date(), 14), "yyyy-MM-dd");

const leaveSchema = z
  .object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    leave_type: z.string().min(1, "Leave type is required"),
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.start_date) return;

    if (data.start_date < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the past",
        path: ["start_date"],
      });
    }

    // Annual leave: 14-day advance notice
    if (data.leave_type === "Annual" && data.start_date < minAnnualDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Annual leave requires at least 14 days advance notice.",
        path: ["start_date"],
      });
    }

    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["end_date"],
      });
    }
  });

type LeaveFormValues = z.infer<typeof leaveSchema>;

const LEAVE_TYPES: { label: string; value: string }[] = [
  { label: "Annual",        value: "Annual" },
  { label: "Sick",          value: "Sick" },
  { label: "Maternity",     value: "Maternity" },
  { label: "Paternity",     value: "Paternity" },
  { label: "Bereavement",   value: "Bereavement" },
  { label: "Unpaid Family", value: "Unpaid Family" },
];

// ---- Status badge ----
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ---- Balance display card ----
function BalanceCard({ label, days }: { label: string; days: number }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-muted/50 border border-border text-center min-w-[90px]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{days}</span>
      <span className="text-[10px] text-muted-foreground">days left</span>
    </div>
  );
}

export default function LeavesPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "policy">("history");
  const { data: leaves, isLoading } = useMyLeaves();
  const applyLeave = useApplyLeave();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _user = useAuthStore((s) => s.user);

  // Fetch full user profile for live leave balances
  const { data: profile } = useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/auth/me");
      return data;
    },
  });

  // Fetch leave policy text (only when that tab is active)
  const { data: policyData, isLoading: policyLoading } = useQuery<{ policy: string }>({
    queryKey: ["leaves", "policy"],
    queryFn: async () => {
      const { data } = await api.get<{ policy: string }>("/leaves/policy");
      return data;
    },
    enabled: activeTab === "policy",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({ resolver: zodResolver(leaveSchema) });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedLeaveType = watch("leave_type");
  const watchedStartDate = watch("start_date");

  // Dynamically restrict the start date calendar based on leave type
  const minStartDate = watchedLeaveType === "Annual" ? minAnnualDate : today;

  const onSubmit = async (values: LeaveFormValues) => {
    // Client-side balance validation before hitting the API
    if (profile) {
      const start = new Date(values.start_date);
      const end = new Date(values.end_date);
      const duration =
        Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      let balance = 0;
      const typeLower = values.leave_type.toLowerCase();
      if (typeLower === "annual") balance = profile.annual_leave_balance ?? 0;
      else if (typeLower === "sick") balance = profile.sick_leave_balance ?? 0;

      // Only block if we have a known balance for this leave type
      if (balance > 0 && duration > balance) {
        setError("leave_type", {
          type: "manual",
          message: `Insufficient balance. You only have ${balance} days remaining.`,
        });
        return;
      }
    }

    await applyLeave.mutateAsync(values);
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Leaves</h1>
          <p className="text-sm text-muted-foreground">View and manage your leave requests</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 h-9">
          <Plus className="w-4 h-4" />
          Apply for Leave
        </Button>
      </div>

      {/* Leave balance chips */}
      {profile && (
        <div className="flex flex-wrap gap-2">
          <BalanceCard label="Annual" days={profile.annual_leave_balance ?? 0} />
          <BalanceCard label="Sick" days={profile.sick_leave_balance ?? 0} />
          <BalanceCard label="Maternity" days={profile.maternity_leave_balance ?? 0} />
          <BalanceCard label="Paternity" days={profile.paternity_leave_balance ?? 0} />
          <BalanceCard label="Bereavement" days={profile.bereavement_leave_balance ?? 0} />
          <BalanceCard label="Unpaid" days={profile.unpaid_leave_balance ?? 0} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "history"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-4 h-4 inline mr-1.5" />
          Leave History
        </button>
        <button
          onClick={() => setActiveTab("policy")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "policy"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1.5" />
          Leave Policy
        </button>
      </div>

      {/* ---- Policy tab ---- */}
      {activeTab === "policy" ? (
        <motion.div
          key="policy"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-xl bg-card p-6"
        >
          <h2 className="text-base font-semibold mb-4">Company Leave Policy</h2>
          {policyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {policyData?.policy ?? "Policy not available."}
            </p>
          )}
        </motion.div>
      ) : (
        /* ---- Leave history table ---- */
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border border-border rounded-xl overflow-hidden bg-card"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">End</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from<number>({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from<number>({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leaves && leaves.length > 0 ? (
                leaves.map((leave, idx) => (
                  <motion.tr
                    key={leave.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <td className="px-4 py-3 font-medium">{leave.leave_type}</td>
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {Math.ceil(Math.abs(new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{leave.start_date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{leave.end_date}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {leave.reason ?? <span className="italic text-muted-foreground/60">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={leave.status} />
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No leave requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* ---- Apply Leave Dialog ---- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request. Annual leave requires 14 days advance notice.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
            {/* Leave type selector */}
            <div className="space-y-1.5">
              <Label htmlFor="leave_type">Leave type</Label>
              <Select
                onValueChange={(v: string | null) => {
                  if (v) setValue("leave_type", v, { shouldValidate: true });
                }}
              >
                <SelectTrigger id="leave_type" className="h-10">
                  <SelectValue placeholder="Select a type…" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leave_type && (
                <p className="text-xs text-destructive">{errors.leave_type.message}</p>
              )}
            </div>

            {/* 14-day notice banner for Annual leave */}
            {watchedLeaveType === "Annual" && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-lg">
                Annual leave must be submitted at least 14 days in advance.
              </p>
            )}

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  min={minStartDate}
                  className="h-10"
                  {...register("start_date")}
                />
                {errors.start_date && (
                  <p className="text-xs text-destructive">{errors.start_date.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  type="date"
                  min={watchedStartDate || minStartDate}
                  className="h-10"
                  {...register("end_date")}
                />
                {errors.end_date && (
                  <p className="text-xs text-destructive">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Briefly describe your reason…"
                className="resize-none h-20"
                {...register("reason")}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
