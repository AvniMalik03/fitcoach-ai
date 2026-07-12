import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Flame,
  Dumbbell,
  Target,
  TrendingUp,
  Salad,
  Clock,
  Zap,
} from "lucide-react";

const stats = [
  {
    id: "calories",
    label: "Calories burned",
    value: "1,842",
    change: "+12%",
    positive: true,
    icon: Flame,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "workouts",
    label: "Workouts this week",
    value: "4",
    change: "+1",
    positive: true,
    icon: Dumbbell,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "nutrition",
    label: "Protein goal",
    value: "87%",
    change: "-5%",
    positive: false,
    icon: Salad,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "streak",
    label: "Day streak",
    value: "12",
    change: "+1",
    positive: true,
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
  },
];

const recentActivity = [
  {
    id: "1",
    title: "Upper Body Strength",
    subtitle: "45 min · 380 kcal",
    time: "Today, 7:00 AM",
    icon: Dumbbell,
  },
  {
    id: "2",
    title: "Breakfast logged",
    subtitle: "Oats, eggs, banana — 620 kcal",
    time: "Today, 8:30 AM",
    icon: Salad,
  },
  {
    id: "3",
    title: "HIIT Session",
    subtitle: "30 min · 450 kcal",
    time: "Yesterday, 6:30 PM",
    icon: Activity,
  },
  {
    id: "4",
    title: "Weekly goal reached",
    subtitle: "You hit your calorie deficit target",
    time: "Yesterday, 9:00 PM",
    icon: Target,
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
    select: { name: true, createdAt: true },
  });

  const firstName = user?.name?.split(" ")[0] ?? session?.user?.name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your fitness journey today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ id, label, value, change, positive, icon: Icon, color }) => (
          <div
            key={id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 card-hover"
          >
            <div
              className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`}
            />
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-gradient-to-br ${color} p-2.5 shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  positive
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map(({ id, title, subtitle, time, icon: Icon }) => (
              <div
                key={id}
                className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-bg shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{time.split(",")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly progress */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Weekly Goals</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {[
              { label: "Workouts", current: 4, target: 5, color: "from-violet-500 to-purple-600" },
              { label: "Calories", current: 6840, target: 8750, color: "from-orange-500 to-red-500" },
              { label: "Protein (g)", current: 380, target: 490, color: "from-emerald-500 to-teal-500" },
              { label: "Water (L)", current: 12.5, target: 14, color: "from-blue-500 to-cyan-500" },
            ].map(({ label, current, target, color }) => {
              const pct = Math.min(100, Math.round((current / target) * 100));
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl gradient-bg p-4 text-white">
            <p className="text-xs font-medium opacity-80">AI Insight</p>
            <p className="mt-1 text-sm font-semibold">
              You&apos;re on track! 🎯 Increase protein by 30g today to hit your weekly target.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
