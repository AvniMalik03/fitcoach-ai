"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Apple,
  Droplets,
  Flame,
  GlassWater,
  Loader2,
  Salad,
  Sparkles,
  Target,
  Utensils,
  Zap,
} from "lucide-react";
import { addWaterIntake } from "@/lib/actions/nutrition";
import type { WeekOneNutritionPlan } from "@/lib/nutrition/generator";

const macroColors = {
  Protein: "from-emerald-500 to-teal-500",
  Carbs: "from-blue-500 to-cyan-500",
  Fat: "from-yellow-500 to-orange-500",
  Water: "from-sky-500 to-cyan-400",
};

function percent(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

function ProgressBar({
  label,
  current,
  target,
  unit,
  color,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = percent(current, target);

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current.toLocaleString()}/{target.toLocaleString()}{unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45 }}
        />
      </div>
    </div>
  );
}

export function NutritionTracker({
  plan,
  initialWaterIntakeMl,
  dateIso,
}: {
  plan: WeekOneNutritionPlan;
  initialWaterIntakeMl: number;
  dateIso: string;
}) {
  const [waterIntakeMl, setWaterIntakeMl] = useState(initialWaterIntakeMl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totals = useMemo(
    () =>
      plan.meals.reduce(
        (total, meal) => ({
          calories: total.calories + meal.calories,
          protein: total.protein + meal.protein,
          carbs: total.carbs + meal.carbs,
          fat: total.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [plan.meals]
  );

  const remainingCalories = Math.max(plan.targetCalories - totals.calories, 0);
  const waterPct = percent(waterIntakeMl, plan.waterGoalMl);
  const waterCups = Math.round(waterIntakeMl / 250);
  const waterCupGoal = Math.round(plan.waterGoalMl / 250);
  const insights = [
    totals.protein < plan.proteinGoal
      ? `Increase protein by ${plan.proteinGoal - totals.protein}g today.`
      : "Protein target is covered by today's plan.",
    waterPct >= 80 ? "Great hydration today." : "Add water steadily through the afternoon.",
    totals.calories <= plan.targetCalories
      ? "You are within your calorie target."
      : "Calories are above target, keep dinner lighter.",
  ];

  const handleAddWater = () => {
    setError(null);
    startTransition(async () => {
      const result = await addWaterIntake({ amountMl: 250, dateIso });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (typeof result.waterIntakeMl === "number") {
        setWaterIntakeMl(result.waterIntakeMl);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Calories", value: totals.calories, target: plan.targetCalories, unit: " kcal", icon: Flame, color: "from-orange-500 to-red-500" },
          { label: "Protein", value: totals.protein, target: plan.proteinGoal, unit: "g", icon: Zap, color: macroColors.Protein },
          { label: "Carbs", value: totals.carbs, target: plan.carbsGoal, unit: "g", icon: Apple, color: macroColors.Carbs },
          { label: "Fat", value: totals.fat, target: plan.fatGoal, unit: "g", icon: Salad, color: macroColors.Fat },
          { label: "Water", value: waterIntakeMl, target: plan.waterGoalMl, unit: "ml", icon: Droplets, color: macroColors.Water },
        ].map(({ label, value, target, unit, icon: Icon, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 card-hover"
          >
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-gradient-to-br ${color} p-2.5 shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {percent(value, target)}%
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">
              {value.toLocaleString()}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Daily Targets</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {remainingCalories.toLocaleString()} calories remaining
              </p>
            </div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <ProgressBar label="Calories" current={totals.calories} target={plan.targetCalories} unit=" kcal" color="from-orange-500 to-red-500" />
            <ProgressBar label="Protein goal" current={totals.protein} target={plan.proteinGoal} unit="g" color={macroColors.Protein} />
            <ProgressBar label="Water goal" current={waterIntakeMl} target={plan.waterGoalMl} unit="ml" color={macroColors.Water} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GlassWater className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold">Quick Add Water</h2>
            </div>
            <span className="text-sm font-bold">
              {(waterIntakeMl / 1000).toFixed(1)} / {(plan.waterGoalMl / 1000).toFixed(1)} L
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: waterCupGoal }).map((_, index) => (
              <div
                key={index}
                className={`h-8 rounded-md transition-colors ${
                  index < waterCups
                    ? "bg-gradient-to-t from-sky-500 to-cyan-400"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.min(waterCups, waterCupGoal)} of {waterCupGoal} glasses
          </p>
          <button
            type="button"
            onClick={handleAddWater}
            disabled={isPending}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-bg px-4 py-3 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplets className="h-4 w-4" />}
            +250ml
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">AI Meal Plan</h2>
            <p className="mt-1 text-xs text-muted-foreground">{plan.title}</p>
          </div>
          <Utensils className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {plan.meals.map((meal, index) => (
            <motion.article
              key={meal.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-border bg-background/40 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{meal.type}</p>
                  <h3 className="mt-1 text-sm font-semibold">{meal.name}</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {meal.calories} kcal
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Protein</p>
                  <p className="mt-0.5 font-semibold">{meal.protein}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Carbs</p>
                  <p className="mt-0.5 font-semibold">{meal.carbs}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fat</p>
                  <p className="mt-0.5 font-semibold">{meal.fat}g</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {meal.ingredients.join(", ")}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Nutrition Insights</h2>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {insights.map((insight) => (
                <p key={insight} className="rounded-xl border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
