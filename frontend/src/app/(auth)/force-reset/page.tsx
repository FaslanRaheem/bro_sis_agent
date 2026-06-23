// ============================================================
// src/app/(auth)/force-reset/page.tsx
// Force password reset — shown when needs_password_reset is true.
// ============================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { containerVariants } from "@/lib/motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axiosClient";

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;


export default function ForceResetPage() {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.patch("/users/me/password", {
        new_password: values.new_password,
      });
      toast.success("Password updated! Please sign in with your new password.");
      // Clear auth and redirect to login
      // eslint-disable-next-line react-hooks/immutability
      document.cookie =
        "hr_auth_present=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(
        error?.response?.data?.detail ?? "Failed to update password."
      );
    }
  };

  return (
    <motion.div
      className="w-full max-w-sm"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="auth-card px-8 py-10 space-y-8">
        <div className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Set a new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Your administrator has required you to change your password before
            continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new_password" className="text-sm font-medium">
              New password
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNew ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="pr-10 h-10 text-sm"
                aria-invalid={!!errors.new_password}
                {...register("new_password")}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your new password"
                className="pr-10 h-10 text-sm"
                aria-invalid={!!errors.confirm_password}
                {...register("confirm_password")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-10 text-sm font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
