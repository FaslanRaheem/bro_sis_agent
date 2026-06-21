// ============================================================
// src/app/(app)/layout.tsx
// Protected app shell — requires authentication.
// Wraps all app pages with Sidebar + Topbar + AnimatePresence.
// ============================================================

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/store/authStore";

/** Map routes to readable titles for the Topbar */
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leaves": "My Leaves",
  "/team-leaves": "Team Leaves",
  "/complaints": "My Complaints",
  "/all-complaints": "All Complaints",
  "/documents": "Document Repository",
  "/chat": "AI Assistant",
  "/users": "User Management",
};

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15 },
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  // Client-side auth guard (middleware handles server-side redirect,
  // this catches the in-memory Zustand state after hydration)
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) {
    // Render nothing while redirect happens
    return null;
  }

  const title = ROUTE_TITLES[pathname] ?? "HR System";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
