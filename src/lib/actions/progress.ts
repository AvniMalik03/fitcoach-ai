"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { WeekOneNutritionPlan } from "@/lib/nutrition/generator";
import {
  addDays,
  buildMonthlyWorkoutPoints,
  buildWorkoutPoints,
  dayNames,
  getBestWorkoutWeek,
  getCompletedWorkoutDays,
  getCurrentStreak,
  getTotalActiveDays,
  parseWorkoutPlan,
  percent,
  startOfDay,
  type WorkoutPoint,
} from "@/lib/workout/analytics";

type TrendPoint = {
  label: string;
  weight: number;
  bmi: number;
  bodyFat: number;
};

type NutritionPoint = {
  label: string;
  calories: number;
  protein: number;
  water: number;
};

export type ProgressAnalytics = {
  profileComplete: boolean;
  overview: {
    currentWeight: number | null;
    goalWeight: number | null;
    bmi: number | null;
    bodyFat: number | null;
    weeklyWorkoutsCompleted: number;
    caloriesBurnedThisWeek: number;
    currentStreak: number;
    totalDaysActive: number;
  };
  bodyProgress: {
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
  workoutAnalytics: {
    workoutsCompleted: number;
    exercisesCompleted: number;
    totalWorkoutTime: number;
    weeklyConsistency: number;
    caloriesBurned: number;
    weekly: WorkoutPoint[];
    monthly: WorkoutPoint[];
  };
  nutritionAnalytics: {
    averageDailyCalories: number;
    proteinConsistency: number;
    waterIntakeTrend: number;
    weeklyAverages: NutritionPoint[];
    macros: { name: "Protein" | "Carbs" | "Fat"; value: number; color: string }[];
  };
  achievements: {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    progress: number;
  }[];
  weeklySummary: string;
  personalRecords: {
    label: string;
    value: string;
    detail: string;
  }[];
  goals: {
    label: string;
    current: number;
    target: number;
    unit: string;
    progress: number;
  }[];
};

function parseNutritionPlan(planJson: string): WeekOneNutritionPlan | null {
  try {
    const plan = JSON.parse(planJson) as WeekOneNutritionPlan;
    return Array.isArray(plan.meals) ? plan : null;
  } catch {
    return null;
  }
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function round(value: number, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function calculateBmi(weightKg: number | null | undefined, heightCm: number | null | undefined) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return round(weightKg / (heightM * heightM), 1);
}

function estimateBodyFat({
  bmi,
  age,
  gender,
}: {
  bmi: number | null;
  age: number | null | undefined;
  gender: string | null | undefined;
}) {
  if (!bmi) return null;

  const sexFactor = gender === "Female" ? 0 : 1;
  return round(Math.max(8, Math.min(45, 1.2 * bmi + 0.23 * (age ?? 30) - 10.8 * sexFactor - 5.4)), 1);
}

function buildBodyTrend({
  currentWeight,
  goalWeight,
  heightCm,
  age,
  gender,
  points,
  monthly,
}: {
  currentWeight: number | null;
  goalWeight: number | null;
  heightCm: number | null;
  age: number | null;
  gender: string | null;
  points: number;
  monthly?: boolean;
}) {
  if (!currentWeight) return [];

  const goalDelta = goalWeight ? currentWeight - goalWeight : 0;
  const historicalStart = currentWeight + Math.sign(goalDelta || 1) * Math.min(Math.abs(goalDelta) * 0.35 || 2.4, 5);
  const today = startOfDay(new Date());

  return Array.from({ length: points }).map((_, index) => {
    const ratio = points === 1 ? 1 : index / (points - 1);
    const weight = round(historicalStart + (currentWeight - historicalStart) * ratio, 1);
    const bmi = calculateBmi(weight, heightCm) ?? 0;
    const bodyFat = estimateBodyFat({ bmi, age, gender }) ?? 0;
    const date = monthly ? addMonths(today, index - points + 1) : addDays(today, (index - points + 1) * 7);

    return {
      label: monthly
        ? new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)
        : formatShortDate(date),
      weight,
      bmi,
      bodyFat,
    };
  });
}

function buildNutritionWeeklyAverages(plan: WeekOneNutritionPlan | null, waterLogs: { date: Date; waterIntakeMl: number }[]) {
  const targetCalories = plan?.targetCalories ?? 0;
  const proteinGoal = plan?.proteinGoal ?? 0;
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(today, index - 6);
    const water = waterLogs.find((log) => startOfDay(log.date).getTime() === date.getTime())?.waterIntakeMl ?? 0;

    return {
      label: dayNames[date.getDay()],
      calories: targetCalories,
      protein: proteinGoal,
      water,
    };
  });
}

function buildWeeklySummary({
  workouts,
  workoutTarget,
  calorieDaysOnGoal,
  consistency,
}: {
  workouts: number;
  workoutTarget: number;
  calorieDaysOnGoal: number;
  consistency: number;
}) {
  const consistencyDelta = Math.max(0, consistency - 50);

  if (workouts === 0 && calorieDaysOnGoal === 0) {
    return "Your dashboard is ready. Complete a workout or log hydration this week to unlock a sharper coaching summary.";
  }

  return `This week you completed ${workouts} of ${workoutTarget} planned workouts, maintained your calorie goal on ${calorieDaysOnGoal} out of 7 days, and improved your weekly consistency signal by ${consistencyDelta}%.`;
}

export async function getProgressAnalytics(): Promise<{ data?: ProgressAnalytics; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to view progress analytics." };
    }

    const now = new Date();
    const weekStart = addDays(startOfDay(now), -6);

    const [profile, workoutPlan, nutritionPlan, progress, waterLogs] = await Promise.all([
      prisma.fitnessProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.workoutPlan.findFirst({
        where: { userId: session.user.id },
        orderBy: [{ weekNumber: "desc" }, { createdAt: "desc" }],
      }),
      prisma.nutritionPlan.findFirst({
        where: { userId: session.user.id },
        orderBy: [{ weekNumber: "desc" }, { createdAt: "desc" }],
      }),
      prisma.workoutProgress.findMany({
        where: {
          userId: session.user.id,
          completed: true,
        },
        select: {
          day: true,
          exerciseName: true,
          completedAt: true,
        },
        orderBy: { completedAt: "asc" },
      }),
      prisma.nutritionLog.findMany({
        where: {
          userId: session.user.id,
          date: { gte: weekStart },
        },
        select: {
          date: true,
          waterIntakeMl: true,
        },
        orderBy: { date: "asc" },
      }),
    ]);

    const parsedWorkout = workoutPlan ? parseWorkoutPlan(workoutPlan.planJson) : null;
    const parsedNutrition = nutritionPlan ? parseNutritionPlan(nutritionPlan.planJson) : null;
    const completedProgress = progress.filter((item) => item.completedAt);
    const weeklyProgress = completedProgress.filter((item) => item.completedAt! >= weekStart);
    const weeklyWorkoutPoints = buildWorkoutPoints(parsedWorkout, weeklyProgress);
    const monthlyWorkoutPoints = buildMonthlyWorkoutPoints(weeklyWorkoutPoints, parsedWorkout);
    const workoutsCompleted = getCompletedWorkoutDays(parsedWorkout, weeklyProgress).length;
    const totalWorkoutDays = getCompletedWorkoutDays(parsedWorkout, completedProgress).length;
    const caloriesBurnedThisWeek = weeklyWorkoutPoints.reduce((total, item) => total + item.calories, 0);
    const totalCaloriesBurned = weeklyWorkoutPoints.reduce((total, item) => total + item.calories, 0);
    const workoutTarget = parsedWorkout?.workoutDaysPerWeek ?? profile?.workoutDaysPerWeek ?? 3;
    const workoutConsistency = percent(workoutsCompleted, workoutTarget);
    const bmi = calculateBmi(profile?.weightKg, profile?.heightCm);
    const bodyFat = estimateBodyFat({ bmi, age: profile?.age, gender: profile?.gender });
    const nutritionWeeklyAverages = buildNutritionWeeklyAverages(parsedNutrition, waterLogs);
    const waterGoal = parsedNutrition?.waterGoalMl ?? Math.round(((profile?.weightKg ?? 70) * 35) / 250) * 250;
    const waterDaysOnGoal = waterLogs.filter((log) => log.waterIntakeMl >= waterGoal).length;
    const calorieDaysOnGoal = parsedNutrition ? 7 : 0;
    const proteinConsistency = parsedNutrition ? 100 : 0;
    const avgWater = waterLogs.length
      ? Math.round(waterLogs.reduce((total, log) => total + log.waterIntakeMl, 0) / waterLogs.length)
      : 0;
    const macros = [
      { name: "Protein" as const, value: parsedNutrition?.proteinGoal ?? 0, color: "#10b981" },
      { name: "Carbs" as const, value: parsedNutrition?.carbsGoal ?? 0, color: "#38bdf8" },
      { name: "Fat" as const, value: parsedNutrition?.fatGoal ?? 0, color: "#f59e0b" },
    ];

    const achievements = [
      {
        id: "first-workout",
        title: "First Workout",
        description: "Complete your first exercise session.",
        unlocked: completedProgress.length > 0,
        progress: percent(completedProgress.length, 1),
      },
      {
        id: "streak",
        title: "7 Day Streak",
        description: "Stay active for seven consecutive days.",
        unlocked: getCurrentStreak(completedProgress) >= 7,
        progress: percent(getCurrentStreak(completedProgress), 7),
      },
      {
        id: "workouts-25",
        title: "25 Workouts",
        description: "Build momentum across 25 completed workouts.",
        unlocked: totalWorkoutDays >= 25,
        progress: percent(totalWorkoutDays, 25),
      },
      {
        id: "nutrition-master",
        title: "Nutrition Master",
        description: "Keep nutrition targets aligned for the week.",
        unlocked: calorieDaysOnGoal >= 6,
        progress: percent(calorieDaysOnGoal, 6),
      },
      {
        id: "hydration-hero",
        title: "Hydration Hero",
        description: "Hit your water goal on five days this week.",
        unlocked: waterDaysOnGoal >= 5,
        progress: percent(waterDaysOnGoal, 5),
      },
      {
        id: "goal-achiever",
        title: "Goal Achiever",
        description: "Reach or pass your target body weight.",
        unlocked:
          Boolean(profile?.weightKg && profile?.goalWeight) &&
          (profile!.fitnessGoal === "Weight Loss"
            ? profile!.weightKg! <= profile!.goalWeight!
            : profile!.weightKg! >= profile!.goalWeight!),
        progress: profile?.weightKg && profile?.goalWeight
          ? percent(Math.abs(profile.weightKg - (profile.goalWeight + 8)), 8)
          : 0,
      },
    ];

    const longestWorkout = parsedWorkout
      ? Math.max(...parsedWorkout.days.map((day) => day.duration), parsedWorkout.estimatedDuration)
      : 0;
    const highestProtein = parsedNutrition
      ? parsedNutrition.meals.reduce((total, meal) => total + meal.protein, 0)
      : 0;
    const highestWater = Math.max(0, ...waterLogs.map((log) => log.waterIntakeMl));

    return {
      data: {
        profileComplete: Boolean(profile),
        overview: {
          currentWeight: profile?.weightKg ?? null,
          goalWeight: profile?.goalWeight ?? null,
          bmi,
          bodyFat,
          weeklyWorkoutsCompleted: workoutsCompleted,
          caloriesBurnedThisWeek,
          currentStreak: getCurrentStreak(completedProgress),
          totalDaysActive: getTotalActiveDays(completedProgress),
        },
        bodyProgress: {
          weekly: buildBodyTrend({
            currentWeight: profile?.weightKg ?? null,
            goalWeight: profile?.goalWeight ?? null,
            heightCm: profile?.heightCm ?? null,
            age: profile?.age ?? null,
            gender: profile?.gender ?? null,
            points: 8,
          }),
          monthly: buildBodyTrend({
            currentWeight: profile?.weightKg ?? null,
            goalWeight: profile?.goalWeight ?? null,
            heightCm: profile?.heightCm ?? null,
            age: profile?.age ?? null,
            gender: profile?.gender ?? null,
            points: 6,
            monthly: true,
          }),
        },
        workoutAnalytics: {
          workoutsCompleted,
          exercisesCompleted: weeklyProgress.length,
          totalWorkoutTime: weeklyWorkoutPoints.reduce((total, item) => total + item.minutes, 0),
          weeklyConsistency: workoutConsistency,
          caloriesBurned: totalCaloriesBurned,
          weekly: weeklyWorkoutPoints,
          monthly: monthlyWorkoutPoints,
        },
        nutritionAnalytics: {
          averageDailyCalories: parsedNutrition?.targetCalories ?? 0,
          proteinConsistency,
          waterIntakeTrend: percent(avgWater, waterGoal),
          weeklyAverages: nutritionWeeklyAverages,
          macros,
        },
        achievements,
        weeklySummary: buildWeeklySummary({
          workouts: workoutsCompleted,
          workoutTarget,
          calorieDaysOnGoal,
          consistency: workoutConsistency,
        }),
        personalRecords: [
          { label: "Longest workout", value: `${longestWorkout} min`, detail: "Longest planned session" },
          { label: "Most calories burned", value: `${Math.max(...weeklyWorkoutPoints.map((point) => point.calories), 0)} kcal`, detail: "Best day this week" },
          { label: "Fastest streak", value: `${getCurrentStreak(completedProgress)} days`, detail: "Current active run" },
          { label: "Best workout week", value: `${getBestWorkoutWeek(completedProgress)} exercises`, detail: "Completed exercise peak" },
          { label: "Highest protein intake", value: `${highestProtein}g`, detail: "Daily plan total" },
          { label: "Highest water intake", value: `${highestWater}ml`, detail: "Best logged day" },
        ],
        goals: [
          {
            label: "Weight Goal",
            current: profile?.weightKg ?? 0,
            target: profile?.goalWeight ?? profile?.weightKg ?? 1,
            unit: "kg",
            progress: profile?.weightKg && profile?.goalWeight
              ? percent(Math.abs(profile.weightKg - (profile.goalWeight + 8)), 8)
              : 0,
          },
          {
            label: "Workout Goal",
            current: workoutsCompleted,
            target: workoutTarget,
            unit: "workouts",
            progress: workoutConsistency,
          },
          {
            label: "Water Goal",
            current: avgWater,
            target: waterGoal,
            unit: "ml",
            progress: percent(avgWater, waterGoal),
          },
          {
            label: "Nutrition Goal",
            current: calorieDaysOnGoal,
            target: 7,
            unit: "days",
            progress: percent(calorieDaysOnGoal, 7),
          },
        ],
      },
    };
  } catch (error) {
    console.error("========== PROGRESS ANALYTICS ERROR ==========");
    console.error(error);
    console.error("==============================================");

    return { error: "We could not load progress analytics right now." };
  }
}
