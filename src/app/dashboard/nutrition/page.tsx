import type { Metadata } from "next";
import { Salad, Plus, Droplets, Flame, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Nutrition" };

const meals = [
  {
    id: "1",
    name: "Breakfast",
    time: "8:30 AM",
    calories: 620,
    protein: 32,
    carbs: 78,
    fat: 18,
    items: ["Oat porridge", "2 boiled eggs", "Banana"],
    logged: true,
  },
  {
    id: "2",
    name: "Lunch",
    time: "1:00 PM",
    calories: 780,
    protein: 48,
    carbs: 65,
    fat: 24,
    items: ["Grilled chicken breast", "Brown rice", "Broccoli"],
    logged: true,
  },
  {
    id: "3",
    name: "Snack",
    time: "4:00 PM",
    calories: 210,
    protein: 18,
    carbs: 22,
    fat: 6,
    items: ["Greek yoghurt", "Mixed berries"],
    logged: false,
  },
  {
    id: "4",
    name: "Dinner",
    time: "7:30 PM",
    calories: 650,
    protein: 42,
    carbs: 58,
    fat: 20,
    items: ["Salmon fillet", "Sweet potato", "Spinach salad"],
    logged: false,
  },
];

const macroColors = {
  protein: "from-violet-500 to-purple-600",
  carbs: "from-blue-500 to-cyan-500",
  fat: "from-yellow-500 to-orange-500",
};

export default function NutritionPage() {
  const totalCalories = 2260;
  const targetCalories = 2500;
  const pct = Math.round((totalCalories / targetCalories) * 100);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily meal tracker and macro breakdown
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl gradient-bg px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Log meal
        </button>
      </div>

      {/* Calorie ring + macros */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Calories */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="url(#grad)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40 * pct / 100} ${2 * Math.PI * 40}`}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <p className="text-2xl font-bold">{pct}%</p>
              <p className="text-[10px] text-muted-foreground">of goal</p>
            </div>
          </div>
          <p className="mt-3 text-lg font-bold">{totalCalories.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">of {targetCalories.toLocaleString()} kcal</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>{targetCalories - totalCalories} kcal remaining</span>
          </div>
        </div>

        {/* Macros */}
        {[
          { key: "protein", label: "Protein", current: 140, target: 180, unit: "g" },
          { key: "carbs", label: "Carbs", current: 223, target: 275, unit: "g" },
          { key: "fat", label: "Fat", current: 68, target: 80, unit: "g" },
        ].map(({ key, label, current, target, unit }) => {
          const p = Math.round((current / target) * 100);
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">{label}</p>
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {current}
                <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
              </p>
              <p className="text-xs text-muted-foreground mb-3">of {target}{unit} goal</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${macroColors[key as keyof typeof macroColors]}`}
                  style={{ width: `${p}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{p}% complete</p>
            </div>
          );
        })}
      </div>

      {/* Water tracker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold">Water intake</h2>
          </div>
          <span className="text-sm font-bold">1.8 / 2.5 L</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-8 flex-1 rounded-md transition-all ${
                i < 7
                  ? "bg-gradient-to-t from-blue-500 to-cyan-400"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">7 of 10 glasses (250ml each)</p>
      </div>

      {/* Meals */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Today&apos;s Meals</h2>
          <p className="text-xs text-muted-foreground">2 of 4 logged</p>
        </div>
        <div className="divide-y divide-border">
          {meals.map((meal) => (
            <div key={meal.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${meal.logged ? "gradient-bg" : "bg-muted"}`}>
                    <Salad className={`h-3.5 w-3.5 ${meal.logged ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{meal.name}</p>
                      <span className="text-xs text-muted-foreground">{meal.time}</span>
                      {meal.logged && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Logged</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {meal.items.join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold">{meal.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
