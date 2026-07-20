import type { WeekOneWorkoutPlan, WorkoutDay, WorkoutExercise } from "@/lib/workout/generator";

export type WorkoutProgressForAnalytics = {
  id?: string;
  day: string;
  exerciseName: string;
  completedAt: Date | null;
};

export type WorkoutPoint = {
  label: string;
  workouts: number;
  exercises: number;
  minutes: number;
  calories: number;
};

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseWorkoutPlan(planJson: string): WeekOneWorkoutPlan | null {
  try {
    const plan = JSON.parse(planJson) as WeekOneWorkoutPlan;
    return Array.isArray(plan.days) ? plan : null;
  } catch {
    return null;
  }
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function percent(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

export function progressKey(day: string, exerciseName: string) {
  return `${day}::${exerciseName}`;
}

export function estimateExerciseCalories(
  difficulty: WorkoutDay["difficulty"],
  exercise: WorkoutExercise
) {
  const difficultyBonus = difficulty === "Hard" ? 8 : difficulty === "Moderate" ? 5 : 3;
  return exercise.sets * difficultyBonus + (exercise.reps.includes("sec") ? 8 : 5);
}

export function getCompletedExerciseKeys(progress: WorkoutProgressForAnalytics[]) {
  return new Set(progress.map((item) => progressKey(item.day, item.exerciseName)));
}

export function getCompletedWorkoutDays(
  plan: WeekOneWorkoutPlan | null,
  progress: WorkoutProgressForAnalytics[]
) {
  if (!plan) return [];

  const completed = getCompletedExerciseKeys(progress);
  return plan.days.filter((day) =>
    day.exercises.every((exercise) => completed.has(progressKey(day.day, exercise.name)))
  );
}

export function getWorkoutCalories(
  plan: WeekOneWorkoutPlan | null,
  progress: WorkoutProgressForAnalytics[]
) {
  if (!plan) return 0;

  const completed = getCompletedExerciseKeys(progress);
  return plan.days.reduce((total, day) => {
    return (
      total +
      day.exercises.reduce((dayTotal, exercise) => {
        return completed.has(progressKey(day.day, exercise.name))
          ? dayTotal + estimateExerciseCalories(day.difficulty, exercise)
          : dayTotal;
      }, 0)
    );
  }, 0);
}

export function getTotalExerciseCount(plan: WeekOneWorkoutPlan | null) {
  return plan?.days.reduce((total, day) => total + day.exercises.length, 0) ?? 0;
}

export function getCurrentStreak(progress: WorkoutProgressForAnalytics[]) {
  const activeDays = new Set(
    progress
      .filter((item) => item.completedAt)
      .map((item) => startOfDay(item.completedAt!).toISOString())
  );

  let streak = 0;
  let cursor = startOfDay(new Date());

  while (activeDays.has(cursor.toISOString())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getTotalActiveDays(progress: WorkoutProgressForAnalytics[]) {
  return new Set(
    progress
      .filter((item) => item.completedAt)
      .map((item) => startOfDay(item.completedAt!).toISOString())
  ).size;
}

export function getBestWorkoutWeek(progress: WorkoutProgressForAnalytics[]) {
  const weeks = new Map<string, number>();

  for (const item of progress) {
    if (!item.completedAt) continue;
    const date = startOfDay(item.completedAt);
    const weekStart = addDays(date, -date.getDay());
    const key = weekStart.toISOString();
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }

  return Math.max(0, ...weeks.values());
}

export function buildWorkoutPoints(
  plan: WeekOneWorkoutPlan | null,
  progress: WorkoutProgressForAnalytics[]
) {
  const today = startOfDay(new Date());
  const dayBuckets = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(today, index - 6);
    return {
      date,
      label: dayNames[date.getDay()],
      workouts: 0,
      exercises: 0,
      minutes: 0,
      calories: 0,
    };
  });

  if (!plan) {
    return dayBuckets.map(({ label, workouts, exercises, minutes, calories }) => ({
      label,
      workouts,
      exercises,
      minutes,
      calories,
    }));
  }

  const completedByDay = new Map<string, WorkoutProgressForAnalytics[]>();
  for (const item of progress) {
    if (!item.completedAt) continue;
    const dateKey = startOfDay(item.completedAt).toISOString();
    completedByDay.set(dateKey, [...(completedByDay.get(dateKey) ?? []), item]);
  }

  return dayBuckets.map(({ date, ...point }) => {
    const completed = completedByDay.get(date.toISOString()) ?? [];
    const completedWorkoutDays = getCompletedWorkoutDays(plan, completed);

    return {
      ...point,
      workouts: completedWorkoutDays.length,
      exercises: completed.length,
      minutes: completedWorkoutDays.length * plan.estimatedDuration,
      calories: getWorkoutCalories(plan, completed),
    };
  });
}

export function buildMonthlyWorkoutPoints(
  weekly: WorkoutPoint[],
  plan: WeekOneWorkoutPlan | null
) {
  const baseWorkouts = weekly.reduce((total, item) => total + item.workouts, 0);
  const baseExercises = weekly.reduce((total, item) => total + item.exercises, 0);
  const baseMinutes = weekly.reduce((total, item) => total + item.minutes, 0);
  const baseCalories = weekly.reduce((total, item) => total + item.calories, 0);
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

  return months.map((label, index) => {
    const ramp = plan ? Math.max(0.25, (index + 1) / months.length) : 0;
    return {
      label,
      workouts: Math.round(baseWorkouts * ramp),
      exercises: Math.round(baseExercises * ramp),
      minutes: Math.round(baseMinutes * ramp),
      calories: Math.round(baseCalories * ramp),
    };
  });
}

export function isWorkoutCompleteOnDate({
  plan,
  progress,
  date,
}: {
  plan: WeekOneWorkoutPlan | null;
  progress: WorkoutProgressForAnalytics[];
  date: Date;
}) {
  if (!plan) return false;

  const targetDay = startOfDay(date).toISOString();
  const completedOnDate = progress.filter(
    (item) => item.completedAt && startOfDay(item.completedAt).toISOString() === targetDay
  );

  return getCompletedWorkoutDays(plan, completedOnDate).length > 0;
}
