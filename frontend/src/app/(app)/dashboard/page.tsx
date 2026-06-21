// ============================================================
// src/app/(app)/dashboard/page.tsx
// Dashboard overview — leave balances, stats, quick links.
// ============================================================

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarX,
  MessageSquareWarning,
  Bot,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axiosClient";
import type { Leave, Complaint, User } from "@/types/models";
import type { Metadata } from "next";

// ---- Data fetching ----

// Fetch the live user profile (includes up-to-date leave balances)
// Note: /auth/me returns `employee_id` instead of `id`, so we remap it.
function useMyProfile() {
  return useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>("/auth/me");
      return {
        ...data,
        id: data.employee_id,          // remap employee_id → id
      } as User;
    },
    staleTime: 0, // always re-fetch so balances are never stale
  });
}

function useMyLeavesSummary() {
  return useQuery<Leave[]>({
    queryKey: ["leaves", "me"],
    queryFn: async () => {
      const { data } = await api.get<Leave[]>("/leaves/me");
      return data;
    },
  });
}

function useMyComplaintsSummary() {
  return useQuery<Complaint[]>({
    queryKey: ["complaints", "me"],
    queryFn: async () => {
      const { data } = await api.get<Complaint[]>("/complaints/me");
      return data;
    },
  });
}

// ---- Animated stat card ----
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  delay: number;
  colorClass?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, delay, colorClass = "text-foreground" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const { data: liveProfile } = useMyProfile();
  const { data: leaves, isLoading: leavesLoading } = useMyLeavesSummary();
  const { data: complaints, isLoading: complaintsLoading } = useMyComplaintsSummary();

  // Sync the fresh profile (with updated balances) back into the auth store
  useEffect(() => {
    if (liveProfile) {
      setUser(liveProfile);
    }
  }, [liveProfile, setUser]);

  // Use live profile for balances; fall back to cached store while loading
  const annualBalance = liveProfile?.annual_leave_balance ?? user?.annual_leave_balance ?? 0;
  const sickBalance = liveProfile?.sick_leave_balance ?? user?.sick_leave_balance ?? 0;

  const pendingLeaves = leaves?.filter((l) => l.status === "pending").length ?? 0;
  const openComplaints = complaints?.filter((c) => c.status !== "resolved").length ?? 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Good {getGreeting()},{" "}
          <span>{user?.full_name?.split(" ")[0] ?? "there"}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your HR workspace.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leavesLoading || complaintsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Annual Leave"
              value={annualBalance}
              subtitle="Days remaining"
              icon={CalendarCheck}
              delay={0.05}
              colorClass="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Sick Leave"
              value={sickBalance}
              subtitle="Days remaining"
              icon={CalendarX}
              delay={0.1}
              colorClass="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Pending Leaves"
              value={pendingLeaves}
              subtitle="Awaiting approval"
              icon={TrendingUp}
              delay={0.15}
              colorClass={pendingLeaves > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}
            />
            <StatCard
              title="Open Complaints"
              value={openComplaints}
              subtitle="Under review"
              icon={MessageSquareWarning}
              delay={0.2}
              colorClass={openComplaints > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}
            />
          </>
        )}
      </div>

      {/* Recent leaves */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                  </div>
                ))}
              </div>
            ) : leaves && leaves.length > 0 ? (
              <div className="space-y-2">
                {leaves.slice(0, 5).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{leave.leave_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {leave.start_date} → {leave.end_date}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No leave requests yet. Apply for your first leave!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${variants[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
