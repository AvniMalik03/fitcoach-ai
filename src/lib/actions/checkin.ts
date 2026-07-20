"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkInSchema, type CheckInInput } from "@/lib/validations/checkin";
import {
  isWorkoutCompleteOnDate,
  parseWorkoutPlan,
} from "@/lib/workout/analytics";
import type { DailyCheckIn } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type SerializedCheckIn = {
  id: string;
  userId: string;
  date: string;
  weight: number | null;
  sleepHours: number;
  energyLevel: number;
  soreness: number;
  motivation: number;
  mood: string | null;
  workoutCompleted: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecoveryAnalysis = {
  hasCheckIn: boolean;
  recoveryScore: number;
  fatigueLevel: "Low" | "Moderate" | "High";
  trainingReadiness: "Excellent" | "Good" | "Moderate" | "Poor";
  recoveryBadge: "Primed" | "Ready" | "Caution" | "Recover";
  aiRecommendation: string;
  recommendations: string[];
  adaptiveWorkoutAdjustment: string;
  checkIn: SerializedCheckIn | null;
  analytics: {
    sleepTrend: TrendPoint[];
    recoveryTrend: TrendPoint[];
    weightTrend: TrendPoint[];
    consistency: number;
    weeklyAverages: {
      sleepHours: number;
      recoveryScore: number;
      weight: number | null;
      energyLevel: number;
      soreness: number;
      motivation: number;
    };
    insights: string[];
  };
};

export type CheckInActionState = {
  success?: boolean;
  error?: string;
};

type TrendPoint = {
  label: string;
  value: number;
};

const emptyAnalytics: RecoveryAnalysis["analytics"] = {
  sleepTrend: [],
  recoveryTrend: [],
  weightTrend: [],
  consistency: 0,
  weeklyAverages: {
    sleepHours: 0,
    recoveryScore: 0,
    weight: null,
    energyLevel: 0,
    soreness: 0,
    motivation: 0,
  },
  insights: [],
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function round(value: number, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function percent(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

function formatLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function serializeCheckIn(checkIn: DailyCheckIn): SerializedCheckIn {
  return {
    ...checkIn,
    date: checkIn.date.toISOString(),
    createdAt: checkIn.createdAt.toISOString(),
    updatedAt: checkIn.updatedAt.toISOString(),
  };
}

function calculateRecoveryScore(checkIn: Pick<DailyCheckIn, "sleepHours" | "energyLevel" | "soreness" | "motivation" | "workoutCompleted">) {
  const sleepScore = Math.min(100, (checkIn.sleepHours / 8) * 100);
  const energyScore = checkIn.energyLevel * 10;
  const sorenessScore = (11 - checkIn.soreness) * 10;
  const motivationScore = checkIn.motivation * 10;
  const completionBonus = checkIn.workoutCompleted ? 4 : 0;

  return Math.max(
    0,
    Math.min(100, Math.round(sleepScore * 0.3 + energyScore * 0.25 + sorenessScore * 0.25 + motivationScore * 0.2 + completionBonus))
  );
}

function fatigueFromScore(score: number): RecoveryAnalysis["fatigueLevel"] {
  if (score >= 75) return "Low";
  if (score >= 50) return "Moderate";
  return "High";
}

function readinessFromScore(score: number): RecoveryAnalysis["trainingReadiness"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  return "Poor";
}

function badgeFromScore(score: number): RecoveryAnalysis["recoveryBadge"] {
  if (score >= 85) return "Primed";
  if (score >= 70) return "Ready";
  if (score >= 50) return "Caution";
  return "Recover";
}

function missedWorkoutDays(checkIns: DailyCheckIn[]) {
  return checkIns.slice(0, 4).filter((item) => !item.workoutCompleted).length;
}

function buildRecommendations(checkIn: DailyCheckIn, recentCheckIns: DailyCheckIn[]) {
  const recommendations: string[] = [];
  const skippedMultipleDays = missedWorkoutDays(recentCheckIns) >= 3;

  if (checkIn.workoutCompleted) {
    recommendations.push("Today's workout is complete. Prioritize recovery, hydration, and sleep now.");
  }

  if (checkIn.sleepHours < 6 && checkIn.soreness > 7) {
    recommendations.push("Reduce today's workout volume by 20%.");
    recommendations.push("Add a longer stretching block after your warm-up.");
    recommendations.push("Hydrate steadily and aim for an earlier bedtime tonight.");
  } else if (checkIn.energyLevel > 8 && checkIn.soreness < 3) {
    recommendations.push("Increase workout intensity slightly if your form feels sharp.");
  } else if (checkIn.motivation <= 3) {
    recommendations.push("Choose a recovery walk or a short mobility session to keep momentum.");
  } else {
    recommendations.push("Keep today's planned session steady and focus on clean reps.");
  }

  if (skippedMultipleDays) {
    recommendations.push("Resume with a lighter session because several recent workouts were skipped.");
  }

  if (checkIn.sleepHours < 6) {
    recommendations.push("Protect sleep tonight before adding extra training volume.");
  }

  return Array.from(new Set(recommendations));
}

function buildMessage(checkIn: DailyCheckIn, score: number, recommendations: string[]) {
  if (checkIn.workoutCompleted) {
    return "Today's workout is complete. Great job - shift the rest of the day toward recovery, hydration, and quality sleep.";
  }

  if (score >= 85) {
    return "Your recovery looks excellent today. Consider increasing workout intensity slightly.";
  }

  if (checkIn.sleepHours < 6 && checkIn.soreness > 7) {
    return "Low sleep and high soreness detected. Focus on recovery before pushing intensity.";
  }

  if (checkIn.motivation <= 3) {
    return "Motivation is low today. A recovery walk still counts and keeps the habit alive.";
  }

  return recommendations[0] ?? "Check in daily to help FitCoach AI adapt your plan.";
}

function buildAnalytics(checkIns: DailyCheckIn[]): RecoveryAnalysis["analytics"] {
  if (checkIns.length === 0) return emptyAnalytics;

  const chronological = [...checkIns].reverse();
  const weekly = chronological.slice(-7);
  const weightValues = weekly.filter((item) => typeof item.weight === "number");
  const recoveryScores = weekly.map(calculateRecoveryScore);
  const average = (values: number[]) => (values.length ? round(values.reduce((total, value) => total + value, 0) / values.length) : 0);
  const consistency = percent(
    weekly.filter((item) => item.date >= addDays(startOfDay(new Date()), -6)).length,
    7
  );
  const insights: string[] = [];

  if (consistency >= 85) {
    insights.push("You've maintained excellent consistency this week.");
  }

  if (average(weekly.map((item) => item.sleepHours)) < 6.5) {
    insights.push("Sleep is trending low. Recovery will improve fastest by protecting bedtime.");
  }

  if (average(recoveryScores) >= 80) {
    insights.push("Recovery has been strong across recent check-ins.");
  }

  return {
    sleepTrend: weekly.map((item) => ({ label: formatLabel(item.date), value: item.sleepHours })),
    recoveryTrend: weekly.map((item) => ({ label: formatLabel(item.date), value: calculateRecoveryScore(item) })),
    weightTrend: weightValues.map((item) => ({ label: formatLabel(item.date), value: item.weight ?? 0 })),
    consistency,
    weeklyAverages: {
      sleepHours: average(weekly.map((item) => item.sleepHours)),
      recoveryScore: average(recoveryScores),
      weight: weightValues.length ? average(weightValues.map((item) => item.weight ?? 0)) : null,
      energyLevel: average(weekly.map((item) => item.energyLevel)),
      soreness: average(weekly.map((item) => item.soreness)),
      motivation: average(weekly.map((item) => item.motivation)),
    },
    insights,
  };
}

function analyzeCheckIn(
  checkIn: DailyCheckIn | null,
  checkIns: DailyCheckIn[],
  workoutCompletedToday: boolean
): RecoveryAnalysis {
  if (!checkIn) {
    return {
      hasCheckIn: false,
      recoveryScore: 0,
      fatigueLevel: "Moderate",
      trainingReadiness: "Moderate",
      recoveryBadge: "Caution",
      aiRecommendation: workoutCompletedToday
        ? "Today's workout is complete. Log a check-in when you can so FitCoach AI can tune recovery guidance."
        : "Complete today's check-in to unlock adaptive coaching.",
      recommendations: workoutCompletedToday
        ? ["Workout complete today. Prioritize recovery, hydration, and sleep."]
        : ["Log sleep, energy, soreness, and motivation to tailor today's plan."],
      adaptiveWorkoutAdjustment: workoutCompletedToday
        ? "No added training today - your workout is already complete."
        : "No adjustment until today's check-in is complete.",
      checkIn: null,
      analytics: buildAnalytics(checkIns),
    };
  }

  const checkInWithWorkoutContext = workoutCompletedToday && !checkIn.workoutCompleted
    ? { ...checkIn, workoutCompleted: true }
    : checkIn;
  const recoveryScore = calculateRecoveryScore(checkInWithWorkoutContext);
  const recommendations = buildRecommendations(checkInWithWorkoutContext, checkIns);

  return {
    hasCheckIn: true,
    recoveryScore,
    fatigueLevel: fatigueFromScore(recoveryScore),
    trainingReadiness: readinessFromScore(recoveryScore),
    recoveryBadge: badgeFromScore(recoveryScore),
    aiRecommendation: buildMessage(checkInWithWorkoutContext, recoveryScore, recommendations),
    recommendations,
    adaptiveWorkoutAdjustment: recommendations[0] ?? "Keep today's workout unchanged.",
    checkIn: serializeCheckIn(checkInWithWorkoutContext),
    analytics: buildAnalytics(checkIns),
  };
}

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function submitDailyCheckIn(
  _prevState: CheckInActionState,
  formData: FormData
): Promise<CheckInActionState> {
  void _prevState;

  const userId = await requireUserId();
  if (!userId) {
    return { error: "Please log in to submit your check-in." };
  }

  const parsed = checkInSchema.safeParse({
    weight: formData.get("weight") ?? "",
    sleepHours: formData.get("sleepHours"),
    energyLevel: formData.get("energyLevel"),
    soreness: formData.get("soreness"),
    motivation: formData.get("motivation"),
    mood: formData.get("mood")?.toString().trim() || undefined,
    workoutCompleted: formData.get("workoutCompleted") === "on",
    notes: formData.get("notes")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your entry and try again." };
  }

  const input: CheckInInput = parsed.data;
  const today = startOfDay(new Date());

  try {
    await prisma.dailyCheckIn.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        weight: input.weight === "" ? null : input.weight,
        sleepHours: input.sleepHours,
        energyLevel: input.energyLevel,
        soreness: input.soreness,
        motivation: input.motivation,
        mood: input.mood || null,
        workoutCompleted: input.workoutCompleted,
        notes: input.notes || null,
      },
      update: {
        weight: input.weight === "" ? null : input.weight,
        sleepHours: input.sleepHours,
        energyLevel: input.energyLevel,
        soreness: input.soreness,
        motivation: input.motivation,
        mood: input.mood || null,
        workoutCompleted: input.workoutCompleted,
        notes: input.notes || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/progress");

    return { success: true };
  } catch {
    return { error: "We could not save your check-in right now." };
  }
}

export async function getLatestCheckIn(): Promise<{ data?: SerializedCheckIn | null; error?: string }> {
  const userId = await requireUserId();
  if (!userId) {
    return { error: "Please log in to view your check-in." };
  }

  try {
    const checkIn = await prisma.dailyCheckIn.findFirst({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return { data: checkIn ? serializeCheckIn(checkIn) : null };
  } catch {
    return { error: "We could not load your latest check-in." };
  }
}

export async function getRecoveryAnalysis(): Promise<{ data?: RecoveryAnalysis; error?: string }> {
  const userId = await requireUserId();
  if (!userId) {
    return { error: "Please log in to view recovery analysis." };
  }

  try {
    const today = startOfDay(new Date());
    const recentStart = addDays(today, -13);
    const [checkIns, workoutPlan] = await Promise.all([
      prisma.dailyCheckIn.findMany({
        where: {
          userId,
          date: { gte: recentStart },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.workoutPlan.findFirst({
        where: { userId },
        orderBy: [{ weekNumber: "desc" }, { createdAt: "desc" }],
      }),
    ]);
    const todaysCheckIn = checkIns.find((item) => item.date.getTime() === today.getTime()) ?? null;
    const parsedWorkout = workoutPlan ? parseWorkoutPlan(workoutPlan.planJson) : null;
    const todaysProgress = workoutPlan
      ? await prisma.workoutProgress.findMany({
        where: {
          userId,
          workoutPlanId: workoutPlan.id,
          completed: true,
          completedAt: {
            gte: today,
            lt: addDays(today, 1),
          },
        },
        select: {
          day: true,
          exerciseName: true,
          completedAt: true,
        },
      })
      : [];
    const workoutCompletedToday = isWorkoutCompleteOnDate({
      plan: parsedWorkout,
      progress: todaysProgress,
      date: today,
    });

    return { data: analyzeCheckIn(todaysCheckIn, checkIns, workoutCompletedToday) };
  } catch {
    return { error: "We could not generate recovery analysis right now." };
  }
}
