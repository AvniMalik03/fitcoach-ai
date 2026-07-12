import type { Metadata } from "next";
import { TrendingUp, Weight, Ruler, Activity, Calendar } from "lucide-react";

export const metadata: Metadata = { title: "Progress" };

const checkIns = [
  { date: "Jul 12", weight: 82.5, bf: 18.2, muscle: 42.1 },
  { date: "Jul 5", weight: 83.1, bf: 18.8, muscle: 41.8 },
  { date: "Jun 28", weight: 83.7, bf: 19.3, muscle: 41.5 },
  { date: "Jun 21", weight: 84.2, bf: 19.8, muscle: 41.2 },
  { date: "Jun 14", weight: 85.0, bf: 20.4, muscle: 40.9 },
];

const milestones = [
  { label: "First 2kg lost", achieved: true, date: "Jun 20" },
  { label: "Hit 150g protein 7 days straight", achieved: true, date: "Jul 1" },
  { label: "Complete 20 workouts", achieved: false, progress: 16 },
  { label: "Reach goal weight (78kg)", achieved: false, progress: 60 },
];

export default function ProgressPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your body composition and fitness milestones
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Current weight", value: "82.5 kg", delta: "-2.5 kg", icon: Weight, positive: true },
          { label: "Body fat", value: "18.2%", delta: "-2.2%", icon: Activity, positive: true },
          { label: "Muscle mass", value: "42.1 kg", delta: "+1.2 kg", icon: TrendingUp, positive: true },
          { label: "BMI", value: "24.1", delta: "-0.8", icon: Ruler, positive: true },
        ].map(({ label, value, delta, icon: Icon, positive }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                {delta}
              </span>
            </div>
            <p className="mt-4 text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Check-in history */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Weekly Check-ins</h2>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg gradient-bg px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity">
            + Log today
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Weight (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Body Fat %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Muscle (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {checkIns.map((ci, idx) => {
                const prev = checkIns[idx + 1];
                const diff = prev ? (ci.weight - prev.weight).toFixed(1) : null;
                return (
                  <tr key={ci.date} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5 font-medium">{ci.date}</td>
                    <td className="px-6 py-3.5">{ci.weight}</td>
                    <td className="px-6 py-3.5">{ci.bf}%</td>
                    <td className="px-6 py-3.5">{ci.muscle}</td>
                    <td className="px-6 py-3.5">
                      {diff && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${parseFloat(diff) < 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                          {parseFloat(diff) < 0 ? "" : "+"}{diff} kg
                        </span>
                      )}
                      {!diff && <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Milestones</h2>
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.achieved ? "gradient-bg text-white" : "bg-muted text-muted-foreground"}`}>
                {m.achieved ? "✓" : m.progress ? `${m.progress}%` : "○"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${m.achieved ? "" : "text-muted-foreground"}`}>{m.label}</p>
                {m.achieved && <p className="text-xs text-emerald-500">Achieved {m.date}</p>}
                {!m.achieved && m.progress && (
                  <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden w-48">
                    <div className="h-full rounded-full gradient-bg" style={{ width: `${m.progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
