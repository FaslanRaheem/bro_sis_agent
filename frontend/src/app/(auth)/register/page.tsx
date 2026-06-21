// ============================================================
// src/app/(auth)/register/page.tsx
// BROSIS Registration — dark AuthKit aesthetic
// ============================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { containerVariants, fieldVariants } from "@/lib/motion";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axiosClient";
import type { RegisterRequest } from "@/types/models";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await api.post<void>("/auth/register", values satisfies RegisterRequest);
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const msg = error?.response?.data?.detail ?? "Registration failed.";
      toast.error(typeof msg === "string" ? msg : "Please check your details.");
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen py-16">
      <motion.div
        className="w-full max-w-[400px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 gap-4">
        <Image
          src="/brosis_logo_dark.png"
          alt="BROSIS"
          width={160}
          height={80}
          className="object-contain"
          priority
        />
        <div className="text-center">
          <p className="text-sm text-white/50">Create your BROSIS account</p>
        </div>
      </div>

      {/* Card */}
      <div className="auth-card px-8 py-8 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Full Name */}
          <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
            <Label htmlFor="full_name" className="text-sm font-medium text-foreground/80">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="Alex Johnson"
                className="pl-9 h-10 text-sm bg-muted/60 border-border/60 focus:border-ring"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
            </div>
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </motion.div>

          {/* Email */}
          <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="pl-9 h-10 text-sm bg-muted/60 border-border/60 focus:border-ring"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </motion.div>

          {/* Password */}
          <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters + uppercase + symbol"
                className="h-10 pr-10 text-sm bg-muted/60 border-border/60 focus:border-ring"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </motion.div>

          {/* Submit */}
          <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={3} className="pt-1">
            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-[oklch(0.35_0.18_220)] to-[oklch(0.55_0.22_175)] hover:opacity-90 border-0 transition-opacity"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </motion.div>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity">
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-center text-[11px] text-white/20 mt-6">
        Secured by BROSIS · Agentic AI for the Workplace
      </p>
      </motion.div>
    </div>
  );
}
