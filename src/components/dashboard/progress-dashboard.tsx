"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  CalendarCheck,
  Dumbbell,
  Flame,
  Gauge,
  GlassWater,
  Lock,
  Medal,
  Salad,
  Sparkles,
  Target,
  Trophy,
  Unlock,
  Weight,
  Zap,
} from "lucide-react";
import type { ProgressAnalytics } from "@/lib/actions/progress";
import { cn } from "@/lib/utils";

type ChartPoint = Record<string, string | number>;
type ChartSeries = { key: string; label: string; color: string };
type Range = "weekly" | "monthly";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.04, duration: 0.3 },
  }),
};

function formatValue(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "Not set";
  return `${value.toLocaleString()}${suffix}`;
}

function maxFromSeries(data: ChartPoint[], series: ChartSeries[]) {
  return Math.max(
    1,
    ...data.flatMap((point) =>
      series.map((item) => (typeof point[item.key] === "number" ? Number(point[item.key]) : 0))
    )
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/30 p-6 text-center">
      <Sparkles className="h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (value: Range) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background/40 p-1">
      {(["weekly", "monthly"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === item ? "gradient-bg text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function LineTrendChart({
  data,
  series,
  height = 240,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No body trend yet"
        description="Complete onboarding with height and weight to generate your estimated progress trend."
      />
    );
  }

  const width = 720;
  const padding = 34;
  const max = maxFromSeries(data, series);
  const min = Math.min(
    ...data.flatMap((point) =>
      series.map((item) => (typeof point[item.key] === "number" ? Number(point[item.key]) : max))
    )
  );
  const range = Math.max(max - min, 1);

  const getPoint = (point: ChartPoint, index: number, key: string) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((Number(point[key]) - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  };

  return (
    <div className="overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full">
        <defs>
          <linearGradient id="chartGrid" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />;
        })}
        {series.map((item) => {
          const points = data.map((point, index) => getPoint(point, index, item.key)).join(" ");
          return (
            <motion.polyline
              key={item.key}
              points={points}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7 }}
            />
          );
        })}
        {data.map((point, index) => (
          <text key={`${point.label}-${index}`} x={padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            {point.label}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, dataKey, color }: { data: ChartPoint[]; dataKey: string; color: string }) {
  const max = Math.max(1, ...data.map((item) => Number(item[dataKey]) || 0));

  return (
    <div className="flex h-56 items-end gap-2">
      {data.map((item, index) => {
        const value = Number(item[dataKey]) || 0;
        return (
          <div key={`${item.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-lg bg-muted/40 px-1.5">
              <motion.div
                className="w-full rounded-md"
                style={{ background: color }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                transition={{ delay: index * 0.04, duration: 0.45 }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ items }: { items: ProgressAnalytics["nutritionAnalytics"]["macros"] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <EmptyState
        title="No macro plan yet"
        description="Generate a nutrition plan to populate your macro distribution."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="hsl(var(--muted))" strokeWidth="5" />
        {items.map((item, index) => {
          const dash = (item.value / total) * 100;
          const offset =
            25 -
            items
              .slice(0, index)
              .reduce((sum, previous) => sum + (previous.value / total) * 100, 0);

          return (
            <motion.circle
              key={item.name}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={item.color}
              strokeWidth="5"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
              initial={{ strokeDasharray: `0 100` }}
              animate={{ strokeDasharray: `${dash} ${100 - dash}` }}
              transition={{ duration: 0.6 }}
            />
          );
        })}
      </svg>
      <div className="grid flex-1 gap-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold">{item.value}g</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number;
  detail: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{detail}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.45 }}
        />
      </div>
    </div>
  );
}

export function ProgressDashboard({ analytics }: { analytics: ProgressAnalytics }) {
  const [bodyRange, setBodyRange] = useState<Range>("weekly");
  const [workoutRange, setWorkoutRange] = useState<Range>("weekly");
  const bodyData = analytics.bodyProgress[bodyRange];
  const workoutData = analytics.workoutAnalytics[workoutRange];

  const kpis = [
    { label: "Current Weight", value: formatValue(analytics.overview.currentWeight, " kg"), icon: Weight, color: "from-blue-500 to-cyan-500" },
    { label: "Goal Weight", value: formatValue(analytics.overview.goalWeight, " kg"), icon: Target, color: "from-violet-500 to-purple-600" },
    { label: "BMI", value: formatValue(analytics.overview.bmi), icon: Gauge, color: "from-emerald-500 to-teal-500" },
    { label: "Body Fat", value: formatValue(analytics.overview.bodyFat, "%"), icon: Activity, color: "from-pink-500 to-rose-500" },
    { label: "Weekly Workouts", value: analytics.overview.weeklyWorkoutsCompleted.toString(), icon: Dumbbell, color: "from-indigo-500 to-sky-500" },
    { label: "Calories Burned", value: `${analytics.overview.caloriesBurnedThisWeek.toLocaleString()} kcal`, icon: Flame, color: "from-orange-500 to-red-500" },
    { label: "Current Streak", value: `${analytics.overview.currentStreak} days`, icon: Zap, color: "from-yellow-500 to-orange-500" },
    { label: "Total Days Active", value: analytics.overview.totalDaysActive.toString(), icon: CalendarCheck, color: "from-lime-500 to-emerald-500" },
  ];

  const unlockedCount = analytics.achievements.filter((item) => item.unlocked).length;
  const hasWorkoutData = analytics.workoutAnalytics.exercisesCompleted > 0;
  const hasNutritionData = analytics.nutritionAnalytics.averageDailyCalories > 0;

  const workoutLineSeries = useMemo(
    () => [{ key: "calories", label: "Calories", color: "#f97316" }],
    []
  );

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor body composition, training consistency, nutrition, and goals over time.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Achievements unlocked</span>
          <span className="ml-2 font-bold gradient-text">{unlockedCount}/{analytics.achievements.length}</span>
        </div>
      </div>

      {!analytics.profileComplete && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
          Complete onboarding to unlock weight, BMI, body fat, and personalized goal analytics.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }, index) => (
          <motion.article
            key={label}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 card-hover"
          >
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl transition-opacity group-hover:opacity-20`} />
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-gradient-to-br ${color} p-2.5 shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </motion.article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Body Progress</h2>
            <p className="mt-1 text-xs text-muted-foreground">Weight, BMI, and estimated body fat trend</p>
          </div>
          <RangeToggle value={bodyRange} onChange={setBodyRange} />
        </div>
        <LineTrendChart
          data={bodyData}
          series={[
            { key: "weight", label: "Weight", color: "#38bdf8" },
            { key: "bmi", label: "BMI", color: "#a78bfa" },
            { key: "bodyFat", label: "Body Fat", color: "#fb7185" },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Workout Analytics</h2>
                <p className="mt-1 text-xs text-muted-foreground">Completion volume, time, consistency, and burn</p>
              </div>
              <RangeToggle value={workoutRange} onChange={setWorkoutRange} />
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-5">
              {[
                { label: "Workouts", value: analytics.workoutAnalytics.workoutsCompleted },
                { label: "Exercises", value: analytics.workoutAnalytics.exercisesCompleted },
                { label: "Minutes", value: analytics.workoutAnalytics.totalWorkoutTime },
                { label: "Consistency", value: `${analytics.workoutAnalytics.weeklyConsistency}%` },
                { label: "Calories", value: analytics.workoutAnalytics.caloriesBurned },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-background/40 p-3">
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {hasWorkoutData ? (
              workoutRange === "weekly" ? (
                <BarChart data={workoutData} dataKey="exercises" color="linear-gradient(135deg, #8b5cf6, #38bdf8)" />
              ) : (
                <LineTrendChart data={workoutData} series={workoutLineSeries} />
              )
            ) : (
              <EmptyState title="No workout completions yet" description="Start a workout and complete exercises to populate weekly and monthly analytics." />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Nutrition Analytics</h2>
                <p className="mt-1 text-xs text-muted-foreground">Calories, protein, hydration, and macros</p>
              </div>
              <Salad className="h-4 w-4 text-muted-foreground" />
            </div>
            {hasNutritionData ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <PieChart items={analytics.nutritionAnalytics.macros} />
                <div className="space-y-5">
                  <ProgressBar label="Average daily calories" value={100} detail={`${analytics.nutritionAnalytics.averageDailyCalories} kcal`} color="from-orange-500 to-red-500" />
                  <ProgressBar label="Protein consistency" value={analytics.nutritionAnalytics.proteinConsistency} detail={`${analytics.nutritionAnalytics.proteinConsistency}%`} color="from-emerald-500 to-teal-500" />
                  <ProgressBar label="Water intake trend" value={analytics.nutritionAnalytics.waterIntakeTrend} detail={`${analytics.nutritionAnalytics.waterIntakeTrend}%`} color="from-sky-500 to-cyan-400" />
                  <div className="grid grid-cols-7 gap-2 pt-2">
                    {analytics.nutritionAnalytics.weeklyAverages.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-background/40 p-2 text-center">
                        <GlassWater className="mx-auto h-3.5 w-3.5 text-cyan-400" />
                        <p className="mt-1 text-[11px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-semibold">{Math.round(item.water / 250)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No nutrition plan yet" description="Generate a nutrition plan to see calorie, macro, protein, and hydration analytics." />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Weekly Summary</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{analytics.weeklySummary}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Goal Tracking</h2>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {analytics.goals.map((goal) => (
                <ProgressBar
                  key={goal.label}
                  label={goal.label}
                  value={goal.progress}
                  detail={`${goal.current.toLocaleString()} / ${goal.target.toLocaleString()} ${goal.unit}`}
                  color={goal.label === "Water Goal" ? "from-sky-500 to-cyan-400" : "from-violet-500 to-purple-600"}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Personal Records</h2>
              <Medal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {analytics.personalRecords.map((record) => (
                <div key={record.label} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-bg">
                    <Trophy className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{record.value}</p>
                    <p className="truncate text-xs text-muted-foreground">{record.label} - {record.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Achievements</h2>
            <p className="mt-1 text-xs text-muted-foreground">Milestones unlock automatically from workout and nutrition progress</p>
          </div>
          <Award className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {analytics.achievements.map((achievement, index) => (
            <motion.article
              key={achievement.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                "rounded-2xl border p-5 transition-colors",
                achievement.unlocked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-background/40 text-muted-foreground"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", achievement.unlocked ? "gradient-bg shadow" : "bg-muted")}>
                  {achievement.unlocked ? <Unlock className="h-4 w-4 text-white" /> : <Lock className="h-4 w-4" />}
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", achievement.unlocked ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>
                  {achievement.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{achievement.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{achievement.description}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full gradient-bg"
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 0.45 }}
                />
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
