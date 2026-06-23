// ============================================================
// src/components/layout/Sidebar.tsx
// Role-filtered navigation sidebar with animated active indicator.
// ============================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  MessageSquareWarning,
  FileText,
  Bot,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Navigation items ordered by role requirement (permissive → restrictive)
const NAV_ITEMS = {
  /** All authenticated users */
  everyone: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Leaves", href: "/leaves", icon: CalendarDays },
    { label: "My Complaints", href: "/complaints", icon: MessageSquareWarning },
    { label: "AI Assistant", href: "/chat", icon: Bot },
  ],
  /** Manager, HR, Admin */
  manager: [
    { label: "Team Leaves", href: "/team-leaves", icon: Users2 },
  ],
  /** HR and Admin */
  hr: [
    { label: "Documents", href: "/documents", icon: FileText },
    { label: "All Complaints", href: "/all-complaints", icon: ShieldCheck },
  ],
  /** Admin only */
  admin: [
    { label: "User Management", href: "/users", icon: Users2 },
  ],
} satisfies Record<string, NavItem[]>;

interface SidebarLinkProps {
  item: NavItem;
  isActive: boolean;
}

function SidebarLink({ item, isActive }: SidebarLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <motion.span
          layoutId="active-nav-pill"
          className="absolute inset-0 bg-accent rounded-lg"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      <Icon className="relative w-4 h-4 shrink-0" />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isHR, isManager } = useRole();

  // Build the visible nav items based on the user's role
  const visibleItems: NavItem[] = [
    ...NAV_ITEMS.everyone,
    ...(isManager ? NAV_ITEMS.manager : []),
    ...(isHR ? NAV_ITEMS.hr : []),
    ...(isAdmin ? NAV_ITEMS.admin : []),
  ];

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* BROSIS Logo */}
      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brosis_logo_light.png"
            alt="BROSIS"
            width={100}
            height={48}
            style={{ width: "auto", height: "auto" }}
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/brosis_logo_dark.png"
            alt="BROSIS"
            width={100}
            height={48}
            style={{ width: "auto", height: "auto" }}
            className="object-contain hidden dark:block"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {visibleItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Footer branding */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground">BROSIS v1.0</p>
        <p className="text-[10px] text-muted-foreground/50">Agentic AI for the Workplace</p>
      </div>
    </aside>
  );
}
