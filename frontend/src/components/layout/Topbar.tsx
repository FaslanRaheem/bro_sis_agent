// ============================================================
// src/components/layout/Topbar.tsx
// Top navigation bar with user avatar, role badge, theme toggle,
// and logout.
// ============================================================

"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

/** Display color for each role badge */
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  hr: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  manager: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  employee: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

/** Get initials from a full name or email */
function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase();
  }
  return (email[0] ?? "U").toUpperCase();
}

export function Topbar({ title }: { title?: string }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Clear routing cookie
    document.cookie =
      "hr_auth_present=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    toast.success("You've been signed out.");
    router.push("/login");
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background shrink-0">
      {/* Page title */}
      <h2 className="text-sm font-semibold text-foreground truncate">
        {title ?? "Dashboard"}
      </h2>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground"
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors outline-none"
              aria-label="User menu"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-medium text-foreground leading-none">
                  {user.full_name ?? user.email}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium capitalize mt-0.5 px-1.5 py-0.5 rounded-full",
                    ROLE_COLORS[user.role] ?? ""
                  )}
                >
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user.full_name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
