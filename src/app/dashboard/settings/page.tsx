import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { User, Bell, Shield, Palette, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

const settingSections = [
  {
    id: "profile",
    title: "Profile",
    description: "Update your fitness goals and personal details",
    icon: User,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Control workout reminders and weekly summaries",
    icon: Bell,
  },
  {
    id: "security",
    title: "Security",
    description: "Change password and manage sessions",
    icon: Shield,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme, font size, and display preferences",
    icon: Palette,
  },
];

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg text-xl font-bold text-white shadow-lg">
            {user?.name
              ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-base font-semibold">{user?.name ?? "Anonymous"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Free plan
            </span>
          </div>
          <button className="ml-auto rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            Edit photo
          </button>
        </div>
      </div>

      {/* Settings sections */}
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {settingSections.map(({ id, title, description, icon: Icon }) => (
          <Link
            key={id}
            href={`/dashboard/settings/${id}`}
            className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-muted/30 transition-colors group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-bg shadow">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Once you delete your account, all data will be permanently removed.
        </p>
        <button className="rounded-xl border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          Delete account
        </button>
      </div>
    </div>
  );
}
