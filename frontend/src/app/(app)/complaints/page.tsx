// ============================================================
// src/app/(app)/complaints/page.tsx
// Employee complaints — file new + view my complaints.
// ============================================================

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { Plus, MessageSquareWarning, ShieldOff, Loader2 } from "lucide-react";
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
import {
  useMyComplaints,
  useFileComplaint,
} from "@/features/complaints/hooks/useComplaints";
import type { ComplaintPriority } from "@/types/models";

// ---- Schema ----
const complaintSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  department: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  is_anonymous: z.boolean(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
};

export default function ComplaintsPage() {
  const [open, setOpen] = useState(false);
  const { data: complaints, isLoading } = useMyComplaints();
  const fileComplaint = useFileComplaint();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { is_anonymous: false as boolean, priority: "Medium" as const },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isAnonymous = watch("is_anonymous");

  const onSubmit = async (values: ComplaintFormValues) => {
    // Sanitize text inputs before sending to protect against XSS in future renders
    const sanitized = {
      ...values,
      title: DOMPurify.sanitize(values.title),
      description: DOMPurify.sanitize(values.description),
      priority: values.priority as ComplaintPriority,
    };
    await fileComplaint.mutateAsync(sanitized);
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Complaints</h1>
          <p className="text-sm text-muted-foreground">Track grievances you&apos;ve submitted</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 h-9">
          <Plus className="w-4 h-4" />
          File Complaint
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border rounded-xl overflow-hidden bg-card"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Title", "Priority", "Department", "Status", "Anonymous", "Filed"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : complaints && complaints.length > 0 ? (
              complaints.map((c, idx) => (
                <motion.tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate">{c.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[c.priority] ?? "bg-muted text-muted-foreground"}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.is_anonymous && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldOff className="w-3 h-3" /> Yes
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <MessageSquareWarning className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No complaints filed yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* File Complaint Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>File a Complaint</DialogTitle>
            <DialogDescription>
              Your complaint will be reviewed by HR. You may submit anonymously.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                className="h-10"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail…"
                className="resize-none h-24"
                aria-invalid={!!errors.description}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High", "Critical"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department">Department (optional)</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering"
                  className="h-10"
                  {...register("department")}
                />
              </div>
            </div>

            {/* Anonymous toggle */}
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isAnonymous ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary"
                {...register("is_anonymous")}
              />
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <ShieldOff className="w-3.5 h-3.5" />
                  Submit anonymously
                </p>
                <p className="text-xs text-muted-foreground">Your name will not be disclosed to HR</p>
              </div>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Complaint
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
