"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Search } from "lucide-react";

interface DashboardNavbarProps {
  title?: string;
}

export function DashboardNavbar({ title }: DashboardNavbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-sm px-6">
      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-foreground mr-auto">
          {title}
        </h1>
      )}

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground ml-auto max-w-xs w-full">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto md:ml-0">
        {/* Notifications */}
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full gradient-bg" />
        </button>

        <ThemeToggle />

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-[11px] font-semibold text-white shadow-md select-none">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
