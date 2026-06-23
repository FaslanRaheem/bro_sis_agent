// ============================================================
// src/app/(auth)/login/page.tsx
// BROSIS Login — AuthKit-style staggered entrance animation
// Sequence: Spark → Headline → Spotlights → 3D Card Stack
// ============================================================

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axiosClient";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest, LoginResponse, User } from "@/types/models";

// ─── Zod schema ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Particle canvas (starfield) ─────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const PARTICLE_COUNT = 160;
    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; opacity: number;
      twinkleSpeed: number; twinkleOffset: number;
    };
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.6 + 0.1,
      twinkleSpeed: Math.random() * 0.008 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;

      for (const p of particles) {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * p.twinkleSpeed + p.twinkleOffset));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 215, 240, ${p.opacity * twinkle})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ─── Grid overlay (AuthKit cross-hatch lines) ─────────────────
function GridOverlay() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundImage: `
          linear-gradient(oklch(0.80 0 0 / 4%) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.80 0 0 / 4%) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
      }}
    />
  );
}

// ─── Spark flash component ────────────────────────────────────
function SparkFlash({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50"
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: [0, 1, 1, 0], scaleY: [0, 1, 1, 0] }}
      transition={{ duration: 0.6, times: [0, 0.15, 0.6, 1], ease: "easeOut" }}
      onAnimationComplete={onComplete}
      style={{ transformOrigin: "top center" }}
    >
      {/* Central bright spike */}
      <div
        style={{
          width: "2px",
          height: "180px",
          background: "linear-gradient(to bottom, oklch(0.95 0.1 195), transparent)",
          boxShadow: "0 0 12px 4px oklch(0.72 0.18 195 / 80%), 0 0 30px 12px oklch(0.55 0.18 205 / 40%)",
          margin: "0 auto",
        }}
      />
      {/* Halo burst */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.72 0.18 195 / 30%) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
    </motion.div>
  );
}

// ─── Volumetric spotlights ────────────────────────────────────
function Spotlights() {
  return (
    <motion.div
      className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0"
      style={{ width: "900px", height: "520px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {/* Left beam */}
      <motion.div
        className="absolute left-0 top-0 w-1/2 h-full"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
        style={{ transformOrigin: "top right" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to bottom left, oklch(0.55 0.18 205 / 22%) 0%, oklch(0.45 0.15 215 / 8%) 40%, transparent 80%)",
            transform: "rotate(-12deg)",
            transformOrigin: "top right",
            filter: "blur(20px)",
          }}
        />
      </motion.div>

      {/* Right beam */}
      <motion.div
        className="absolute right-0 top-0 w-1/2 h-full"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
        style={{ transformOrigin: "top left" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to bottom right, oklch(0.55 0.18 205 / 22%) 0%, oklch(0.45 0.15 215 / 8%) 40%, transparent 80%)",
            transform: "rotate(12deg)",
            transformOrigin: "top left",
            filter: "blur(20px)",
          }}
        />
      </motion.div>

      {/* Central top glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          height: "260px",
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.55 0.18 205 / 35%) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />
    </motion.div>
  );
}

// ─── "Introducing" label ──────────────────────────────────────
const fadeUpVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 90, damping: 18 },
  },
};

// ─── Actual login form (center card) ──────────────────────────
function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const { login: storeLogin, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data: authData } = await api.post<LoginResponse>(
        "/auth/login",
        values satisfies LoginRequest
      );
      // eslint-disable-next-line react-hooks/immutability
      api.defaults.headers.common["Authorization"] = `Bearer ${authData.access_token}`;
      const { data: user } = await api.get<User>("/auth/me");
      storeLogin(authData.access_token, user);
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = "hr_auth_present=1; path=/; SameSite=Strict";
      if (authData.needs_password_reset) {
        router.push("/force-reset");
      } else {
        toast.success(`Welcome back, ${user.full_name ?? user.email}!`);
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const msg = error?.response?.data?.detail ?? "Invalid email or password.";
      toast.error(typeof msg === "string" ? msg : "Login failed.");
    }
  };

  return (
    <div
      style={{
        width: "360px",
        background: "oklch(0.13 0.025 250 / 95%)",
        border: "1px solid oklch(1 0 0 / 12%)",
        borderRadius: "18px",
        backdropFilter: "blur(20px)",
        padding: "32px",
        boxShadow:
          "0 0 0 1px oklch(1 0 0 / 6%), 0 8px 48px oklch(0 0 0 / 60%), 0 0 80px oklch(0.45 0.18 205 / 12%)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px", gap: "10px" }}>
        <Image
          src="/brosis_logo_dark.png"
          alt="BROSIS"
          width={140}
          height={70}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
          priority
        />
        <p style={{ fontSize: "13px", color: "oklch(0.55 0 0)" }}>Sign in to your workspace</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="email" style={{ fontSize: "13px", color: "oklch(0.75 0 0)", fontWeight: 500 }}>
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            {...register("email")}
            style={{
              height: "38px",
              fontSize: "13px",
              background: "oklch(0.16 0.02 250)",
              border: `1px solid ${errors.email ? "oklch(0.704 0.191 22.216)" : "oklch(1 0 0 / 10%)"}`,
              borderRadius: "8px",
              color: "oklch(0.95 0 0)",
            }}
          />
          {errors.email && (
            <p style={{ fontSize: "11px", color: "oklch(0.704 0.191 22.216)" }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="password" style={{ fontSize: "13px", color: "oklch(0.75 0 0)", fontWeight: 500 }}>
            Password
          </Label>
          <div style={{ position: "relative" }}>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
              style={{
                height: "38px",
                fontSize: "13px",
                paddingRight: "40px",
                background: "oklch(0.16 0.02 250)",
                border: `1px solid ${errors.password ? "oklch(0.704 0.191 22.216)" : "oklch(1 0 0 / 10%)"}`,
                borderRadius: "8px",
                color: "oklch(0.95 0 0)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "oklch(0.50 0 0)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
            </button>
          </div>
          {errors.password && (
            <p style={{ fontSize: "11px", color: "oklch(0.704 0.191 22.216)" }}>{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            height: "38px",
            fontSize: "13px",
            fontWeight: 600,
            background: isSubmitting
              ? "oklch(0.25 0.04 240)"
              : "linear-gradient(135deg, oklch(0.35 0.18 220), oklch(0.55 0.22 175))",
            border: "none",
            borderRadius: "8px",
            color: "oklch(0.97 0 0)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "opacity 0.15s ease",
            marginTop: "4px",
          }}
        >
          {isSubmitting && <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />}
          {isSubmitting ? "Signing in…" : "Continue"}
        </Button>
      </form>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: "12px", color: "oklch(0.42 0 0)", marginTop: "20px" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          style={{ color: "oklch(0.72 0.18 195)", fontWeight: 600, textDecoration: "none" }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

// ─── Main animated scene ──────────────────────────────────────
function LoginScene() {
  const [phase, setPhase] = useState<"spark" | "headline" | "cards">("spark");

  return (
    <div className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {/* Background layers */}
      <ParticleCanvas />
      <GridOverlay />

      {/* Top navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 5%)" }}
      >
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brosis_logo_dark.png" alt="BROSIS Logo" className="h-9 w-auto" />
        </div>
        <div style={{ fontSize: "11px", color: "oklch(0.38 0 0)" }}>
          Agentic AI for the Workplace
        </div>
      </nav>

      {/* ── Phase 0: Spark flash ──────────────────── */}
      <AnimatePresence>
        {phase === "spark" && (
          <SparkFlash onComplete={() => setPhase("headline")} />
        )}
      </AnimatePresence>

      {/* ── Phase 1+: Spotlights (shown after spark) ─ */}
      {phase !== "spark" && <Spotlights />}

      {/* ── Main content ─────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center w-full min-h-screen pt-32 pb-16">

        {/* Headline block */}
        <AnimatePresence>
          {phase !== "spark" && (
            <motion.div
              key="headline"
              className="flex flex-col items-center text-center"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.18, delayChildren: 0 } },
              }}
            >
              {/* "Introducing" pill */}
              <motion.div variants={fadeUpVariant} style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "oklch(0.55 0.10 205)",
                    background: "oklch(0.20 0.04 220 / 60%)",
                    border: "1px solid oklch(0.45 0.12 205 / 30%)",
                    borderRadius: "100px",
                    padding: "4px 14px",
                    display: "inline-block",
                  }}
                >
                  Introducing
                </span>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                variants={fadeUpVariant}
                style={{
                  fontSize: "clamp(52px, 8vw, 96px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                  color: "transparent",
                  background: "linear-gradient(180deg, oklch(0.97 0 0) 0%, oklch(0.72 0.10 220) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  marginBottom: "20px",
                }}
              >
                BROSIS
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeUpVariant}
                style={{
                  fontSize: "15px",
                  color: "oklch(0.55 0 0)",
                  maxWidth: "420px",
                  lineHeight: 1.6,
                  marginBottom: "8px",
                }}
              >
                Agentic AI for the Workplace
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Card Stack */}
        <AnimatePresence>
          {phase !== "spark" && (
            <motion.div
              key="cards"
              className="relative flex items-end justify-center w-full mt-14"
              style={{ height: "420px" }}
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.12, delayChildren: 0.55 } },
              }}
              onAnimationComplete={() => {
                if (phase === "headline") setPhase("cards");
              }}
            >


              {/* Center card (actual form) */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 80 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 80, damping: 18, delay: 0.1 },
                  },
                }}
                style={{
                  position: "relative",
                  zIndex: 20,
                  bottom: 0,
                }}
              >
                <Suspense
                  fallback={
                    <div
                      style={{
                        width: "360px",
                        height: "380px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "oklch(0.13 0.025 250 / 95%)",
                        borderRadius: "18px",
                        border: "1px solid oklch(1 0 0 / 12%)",
                      }}
                    >
                      <Loader2
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "oklch(0.55 0 0)",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    </div>
                  }
                >
                  <LoginFormInner />
                </Suspense>
              </motion.div>


            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom tag */}
        {phase === "cards" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              fontSize: "11px",
              color: "oklch(0.30 0 0)",
              marginTop: "32px",
              textAlign: "center",
            }}
          >
            Secured by BROSIS · Agentic AI for the Workplace
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginScene />;
}
