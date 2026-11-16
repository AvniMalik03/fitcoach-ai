"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Bell,
  Search,
  LayoutDashboard,
  Dumbbell,
  Salad,
  ShieldCheck,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavbarProps {
  title?: string;
}

interface SearchItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const searchItems: SearchItem[] = [
  {
    title: "Overview",
    description: "Daily stats, quick actions & recovery insights",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["overview", "dashboard", "home", "stats", "summary"],
  },
  {
    title: "Workouts",
    description: "Personalised training plan & active routine",
    href: "/dashboard/workout",
    icon: Dumbbell,
    keywords: ["workouts", "workout", "exercise", "training", "gym", "plan", "fitness"],
  },
  {
    title: "Nutrition",
    description: "Macro targets, meal plans & calorie tracking",
    href: "/dashboard/nutrition",
    icon: Salad,
    keywords: ["nutrition", "food", "diet", "macros", "calories", "meals"],
  },
  {
    title: "Check-in",
    description: "Daily readiness, fatigue & recovery check-in",
    href: "/dashboard/check-in",
    icon: ShieldCheck,
    keywords: ["check-in", "checkin", "daily", "recovery", "readiness", "sleep", "stress"],
  },
  {
    title: "Progress",
    description: "Body weight trends, charts & workout analytics",
    href: "/dashboard/progress",
    icon: TrendingUp,
    keywords: ["progress", "analytics", "trends", "weight", "charts", "history"],
  },
  {
    title: "Settings",
    description: "Profile, preferences & account settings",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["settings", "profile", "account", "preferences", "config"],
  },
];

export function DashboardNavbar({ title }: DashboardNavbarProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchItems.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0
          ? (prev - 1 + filteredItems.length) % filteredItems.length
          : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        const target = filteredItems[selectedIndex];
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
        router.push(target.href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-sm px-6">
      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-foreground mr-auto">
          {title}
        </h1>
      )}

      {/* Search */}
      <div
        ref={searchRef}
        className="relative hidden md:block ml-auto max-w-xs w-full"
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-150 focus-within:border-primary/50 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20",
            isOpen && "border-primary/50 bg-background ring-1 ring-primary/20"
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search dashboard navigation"
            aria-expanded={isOpen}
            aria-controls="dashboard-search-results"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="ml-auto pointer-events-none inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div
            id="dashboard-search-results"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-xl"
          >
            {filteredItems.length > 0 ? (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {query.trim() ? "Matching Pages" : "Quick Navigation"}
                </div>
                <div className="space-y-0.5">
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60",
                            isSelected
                              ? "gradient-bg text-white shadow-sm"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-foreground truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs font-medium text-foreground">
                  No matching pages
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  No page found for &ldquo;{query}&rdquo;.
                </p>
              </div>
            )}
          </div>
        )}
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
