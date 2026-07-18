"use client";

import { motion } from "framer-motion";
import { Activity, BadgeCheck, BarChart3, Battery, HeartPulse, Sparkles, TrendingUp } from "lucide-react";
import type { RecoveryAnalysis } from "@/lib/actions/checkin";

type TrendPoint = {
  label: string;
  value: number;
};

function MiniLineChart({ data, color, suffix = "" }: { data: TrendPoint[]; color: string; suffix?: string }) {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-background/30 p-4 text-center text-xs text-muted-foreground">
        Add a few check-ins to reveal this trend.
      </div>
    );
  }

  const width = 420;
  const height = 160;
  const padding = 22;
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = data
    .map((item, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
        {[0, 1, 2].map((line) => {
          const y = padding + line * ((height - padding * 2) / 2);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />;
        })}
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
        />
        {data.map((item, index) => (
          <g key={`${item.label}-${index}`}>
            <text x={padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2)} y={height - 5} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {item.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">
        Latest: <span className="font-medium text-foreground">{data.at(-1)?.value.toLocaleString()}{suffix}</span>
      </p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Activity; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 card-hover">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl transition-opacity group-hover:opacity-20`} />
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function RecoveryDashboard({ analysis }: { analysis: RecoveryAnalysis }) {
  const averages = analysis.analytics.weeklyAverages;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Recovery Score" value={`${analysis.recoveryScore}%`} icon={Activity} color="from-emerald-500 to-teal-500" />
        <MetricCard label="Fatigue Level" value={analysis.fatigueLevel} icon={HeartPulse} color="from-orange-500 to-red-500" />
        <MetricCard label="Readiness" value={analysis.trainingReadiness} icon={Battery} color="from-violet-500 to-purple-600" />
        <MetricCard label="Consistency" value={`${analysis.analytics.consistency}%`} icon={BadgeCheck} color="from-blue-500 to-cyan-500" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-bg shadow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">AI Recovery Insight</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{analysis.aiRecommendation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.recommendations.map((item) => (
                <span key={item} className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sleep Trend</h2>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <MiniLineChart data={analysis.analytics.sleepTrend} color="#38bdf8" suffix="h" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recovery Trend</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <MiniLineChart data={analysis.analytics.recoveryTrend} color="#a78bfa" suffix="%" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weight Trend</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <MiniLineChart data={analysis.analytics.weightTrend} color="#34d399" suffix="kg" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Weekly Averages</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Sleep", value: `${averages.sleepHours}h` },
              { label: "Recovery", value: `${averages.recoveryScore}%` },
              { label: "Weight", value: averages.weight ? `${averages.weight}kg` : "Not logged" },
              { label: "Energy", value: `${averages.energyLevel}/10` },
              { label: "Soreness", value: `${averages.soreness}/10` },
              { label: "Motivation", value: `${averages.motivation}/10` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Coaching Notes</h2>
          <div className="mt-5 space-y-3">
            {(analysis.analytics.insights.length ? analysis.analytics.insights : ["Keep logging daily check-ins to unlock stronger weekly coaching patterns."]).map((item) => (
              <p key={item} className="rounded-xl border border-border bg-background/40 p-4 text-sm leading-6 text-muted-foreground">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
