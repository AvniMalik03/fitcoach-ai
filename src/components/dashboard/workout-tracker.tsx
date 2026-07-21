"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import type { WeekOneWorkoutPlan, WorkoutDay, WorkoutExercise } from "@/lib/workout/generator";
import {
  resetWorkoutDay,
  startWorkoutDay,
  toggleExerciseCompletion,
  type SerializedWorkoutProgress,
} from "@/lib/actions/workout-progress";
import { cn } from "@/lib/utils";

type DayStatus = "Completed" | "In Progress" | "Not Started";

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-500",
  Moderate: "bg-yellow-500/10 text-yellow-500",
  Hard: "bg-red-500/10 text-red-500",
};

const statusColors: Record<DayStatus, string> = {
  Completed: "bg-emerald-500/10 text-emerald-500",
  "In Progress": "bg-yellow-500/10 text-yellow-500",
  "Not Started": "bg-muted text-muted-foreground",
};

const motivationMessages = [
  "Great consistency!",
  "Keep your rest periods under control today.",
  "Focus on proper form rather than speed.",
  "Hydrate before your next session.",
];

function AnimatedNumber({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const currentVal = parseInt(node.textContent || "0");
      const controls = animate(currentVal, value, {
        duration: 0.5,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = Math.round(v).toString();
        },
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={nodeRef}>{value}</span>;
}

function progressKey(day: string, exerciseName: string) {
  return `${day}::${exerciseName}`;
}

function getTargetMuscle(exerciseName: string, focus: string) {
  const name = exerciseName.toLowerCase();

  if (name.includes("squat") || name.includes("lunge") || name.includes("leg")) return "Quads";
  if (name.includes("glute") || name.includes("hip")) return "Glutes";
  if (name.includes("press") || name.includes("push")) return "Chest";
  if (name.includes("row") || name.includes("pulldown") || name.includes("pull")) return "Back";
  if (name.includes("curl")) return "Biceps";
  if (name.includes("triceps") || name.includes("dip")) return "Triceps";
  if (name.includes("plank") || name.includes("dead bug") || name.includes("pallof")) return "Core";
  if (name.includes("march") || name.includes("climber") || name.includes("treadmill")) return "Cardio";
  if (focus.toLowerCase().includes("lower")) return "Lower Body";
  if (focus.toLowerCase().includes("upper")) return "Upper Body";

  return "Full Body";
}

function estimateCalories(exercise: WorkoutExercise, difficulty: WorkoutDay["difficulty"]) {
  const difficultyBonus = difficulty === "Hard" ? 8 : difficulty === "Moderate" ? 5 : 3;
  return exercise.sets * difficultyBonus + (exercise.reps.includes("sec") ? 8 : 5);
}

function describeExercise(exerciseName: string, muscle: string) {
  return `${exerciseName} builds ${muscle.toLowerCase()} strength while reinforcing controlled movement and steady breathing.`;
}

function getTips(exerciseName: string) {
  const name = exerciseName.toLowerCase();

  if (name.includes("squat") || name.includes("lunge")) {
    return ["Keep your chest tall.", "Drive through your whole foot.", "Control the lowering phase."];
  }

  if (name.includes("press") || name.includes("push")) {
    return ["Keep ribs stacked over hips.", "Pause briefly at the bottom.", "Avoid shrugging your shoulders."];
  }

  if (name.includes("row") || name.includes("pull")) {
    return ["Pull elbows toward your ribs.", "Squeeze your shoulder blades.", "Keep your neck relaxed."];
  }

  if (name.includes("plank") || name.includes("dead bug") || name.includes("pallof")) {
    return ["Brace gently before each rep.", "Move slowly.", "Stop before your low back arches."];
  }

  return ["Move with intent.", "Keep breathing steady.", "Choose form over speed."];
}

function getCommonMistakes(muscle: string) {
  if (muscle === "Core") return "Holding your breath or letting the lower back arch.";
  if (muscle === "Cardio") return "Rushing the pace before your form is stable.";
  if (muscle === "Back") return "Pulling with the neck instead of the upper back.";
  if (muscle === "Chest") return "Flaring elbows too wide or losing shoulder control.";

  return "Using momentum instead of a controlled range of motion.";
}

function pickTodayWorkout(plan: WeekOneWorkoutPlan, completedDays: Set<string>) {
  const todayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  const scheduledToday = plan.days.find((day) => day.day === todayName);

  if (scheduledToday) return scheduledToday;

  return plan.days.find((day) => !completedDays.has(day.day)) ?? plan.days[0];
}

export function WorkoutTracker({
  plan,
  workoutPlanId,
  initialProgress,
}: {
  plan: WeekOneWorkoutPlan;
  workoutPlanId: string;
  initialProgress: SerializedWorkoutProgress[];
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [activeDayName, setActiveDayName] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompleteRef = useRef<boolean>(false);

  const completedExerciseKeys = useMemo(
    () =>
      new Set(
        progress
          .filter((item) => item.completed)
          .map((item) => progressKey(item.day, item.exerciseName))
      ),
    [progress]
  );

  const startedDays = useMemo(
    () => new Set(progress.map((item) => item.day)),
    [progress]
  );

  const dayStatuses = useMemo(() => {
    return new Map(
      plan.days.map((day) => {
        const completedCount = day.exercises.filter((exercise) =>
          completedExerciseKeys.has(progressKey(day.day, exercise.name))
        ).length;

        const status: DayStatus =
          completedCount === day.exercises.length
            ? "Completed"
            : completedCount > 0 || startedDays.has(day.day)
              ? "In Progress"
              : "Not Started";

        return [day.day, status] as const;
      })
    );
  }, [completedExerciseKeys, plan.days, startedDays]);

  const completedDays = useMemo(
    () =>
      new Set(
        plan.days
          .filter((day) => dayStatuses.get(day.day) === "Completed")
          .map((day) => day.day)
      ),
    [dayStatuses, plan.days]
  );

  const todayWorkout = pickTodayWorkout(plan, completedDays);
  const activeDay = plan.days.find((day) => day.day === activeDayName) ?? todayWorkout;

  const allExercises = plan.days.flatMap((day) =>
    day.exercises.map((exercise) => ({ day, exercise }))
  );
  const completedExerciseCount = allExercises.filter(({ day, exercise }) =>
    completedExerciseKeys.has(progressKey(day.day, exercise.name))
  ).length;
  const remainingExerciseCount = allExercises.length - completedExerciseCount;
  const weeklyProgressPercent =
    plan.days.length > 0 ? Math.round((completedDays.size / plan.days.length) * 100) : 0;
  const caloriesBurned = allExercises.reduce((total, { day, exercise }) => {
    if (!completedExerciseKeys.has(progressKey(day.day, exercise.name))) return total;
    return total + estimateCalories(exercise, day.difficulty);
  }, 0);

  const activeDayCompletedCount = activeDay.exercises.filter((exercise) =>
    completedExerciseKeys.has(progressKey(activeDay.day, exercise.name))
  ).length;
  const activeDayComplete = activeDayCompletedCount === activeDay.exercises.length;
  const activeDayStarted =
    startedDays.has(activeDay.day) || activeDayCompletedCount > 0 || activeDayName === activeDay.day;
  const activeDayCalories = activeDay.exercises.reduce(
    (total, exercise) => total + estimateCalories(exercise, activeDay.difficulty),
    0
  );
  const motivation =
    motivationMessages[(completedExerciseCount + activeDay.day.length) % motivationMessages.length];

  useEffect(() => {
    if (activeDayComplete && !prevCompleteRef.current) {
      setShowToast(true);
      setShowCelebration(true);
      
      const toastTimer = setTimeout(() => setShowToast(false), 5000);
      const celebTimer = setTimeout(() => setShowCelebration(false), 4000);
      
      router.refresh();

      return () => {
        clearTimeout(toastTimer);
        clearTimeout(celebTimer);
      };
    }
    prevCompleteRef.current = activeDayComplete;
  }, [activeDayComplete, router]);

  const handleToggle = (exercise: WorkoutExercise, completed: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await toggleExerciseCompletion({
        workoutPlanId,
        day: activeDay.day,
        exerciseName: exercise.name,
        completed,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.progress) {
        setProgress(result.progress);
      }
    });
  };

  const handleResetDay = () => {
    setError(null);
    startTransition(async () => {
      const result = await resetWorkoutDay({
        workoutPlanId,
        day: activeDay.day,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.progress) {
        setProgress(result.progress);
      }
    });
  };

  const handleStartDay = () => {
    if (activeDayStarted) {
      setActiveDayName(activeDay.day);
      return;
    }

    setError(null);
    setActiveDayName(activeDay.day);
    startTransition(async () => {
      const result = await startWorkoutDay({
        workoutPlanId,
        day: activeDay.day,
        exerciseNames: activeDay.exercises.map((exercise) => exercise.name),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.progress) {
        setProgress(result.progress);
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

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Weekly Progress</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-3 w-44 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full gradient-bg"
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyProgressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm font-semibold"><AnimatedNumber value={weeklyProgressPercent} />%</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {completedDays.size} / {plan.days.length} Sessions Completed
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-lg font-bold"><AnimatedNumber value={completedExerciseCount} /></p>
              <p className="text-xs text-muted-foreground">Exercises Completed</p>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-lg font-bold"><AnimatedNumber value={remainingExerciseCount} /></p>
              <p className="text-xs text-muted-foreground">Remaining Exercises</p>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-lg font-bold"><AnimatedNumber value={caloriesBurned} /></p>
              <p className="text-xs text-muted-foreground">Calories Burned Estimate</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {plan.days.map((day) => {
          const status = dayStatuses.get(day.day) ?? "Not Started";
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => setActiveDayName(day.day)}
              className={cn(
                "rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30",
                activeDay.day === day.day && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{day.day}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{day.focus}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[status])}>
                  {status}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-bg shadow-lg">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Today&apos;s Workout</p>
              <h2 className="mt-1 text-xl font-bold">{activeDay.focus}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeDay.day} - {activeDay.exercises.length} exercises - {activeDay.duration} min
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", difficultyColors[activeDay.difficulty])}>
                  {activeDay.difficulty}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {activeDayCompletedCount} / {activeDay.exercises.length} complete
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleStartDay}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-5 py-3 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90"
            >
              <Play className="h-4 w-4" />
              {activeDayStarted ? "Continue Workout" : "Start Workout"}
            </button>
            <button
              type="button"
              onClick={handleResetDay}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Day
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">AI Motivation</h2>
            <p className="mt-1 text-sm text-muted-foreground">{motivation}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Exercise Cards</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span>{activeDay.warmup}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {activeDay.exercises.map((exercise) => {
            const key = progressKey(activeDay.day, exercise.name);
            const completed = completedExerciseKeys.has(key);
            const muscle = getTargetMuscle(exercise.name, activeDay.focus);
            const calories = estimateCalories(exercise, activeDay.difficulty);
            const expanded = expandedExercise === key;
            const tips = getTips(exercise.name);

            return (
              <motion.article
                key={key}
                layout
                initial={{ opacity: 1 }}
                animate={{ 
                  opacity: completed ? 0.7 : 1, 
                  scale: completed ? 0.98 : 1 
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "rounded-2xl border border-border bg-card p-5 transition-colors",
                  completed && "border-emerald-500/20 bg-emerald-500/5"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={cn(
                      "text-sm font-semibold transition-all duration-300", 
                      completed && "text-muted-foreground line-through"
                    )}>
                      {exercise.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{muscle}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", difficultyColors[activeDay.difficulty])}>
                    {activeDay.difficulty}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Sets</p>
                    <p className="mt-0.5 font-semibold">{exercise.sets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reps</p>
                    <p className="mt-0.5 font-semibold">{exercise.reps}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rest</p>
                    <p className="mt-0.5 font-semibold">{exercise.restTime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Calories</p>
                    <p className="mt-0.5 font-semibold">{calories}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <AnimatePresence mode="wait">
                    {completed ? (
                      <motion.button
                        key="completed"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        type="button"
                        onClick={() => handleToggle(exercise, false)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-500 disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" />
                        Completed
                      </motion.button>
                    ) : (
                      <motion.button
                        key="incomplete"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        type="button"
                        onClick={() => handleToggle(exercise, true)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-xl gradient-bg px-4 py-2 text-sm font-medium text-white shadow-md transition-transform active:scale-95 disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" />
                        Complete Exercise
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setExpandedExercise(expanded ? null : key)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Info className="h-4 w-4" />
                    Details
                    <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                  </button>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 space-y-4 border-t border-border pt-4 text-sm">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Description</p>
                          <p className="mt-1">{describeExercise(exercise.name, muscle)}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Primary Muscle</p>
                            <p className="mt-1">{muscle}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Equipment</p>
                            <p className="mt-1">{plan.equipment.join(", ")}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Tips</p>
                          <ul className="mt-1 list-inside list-disc space-y-1">
                            {tips.map((tip) => (
                              <li key={tip}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Common Mistakes</p>
                          <p className="mt-1">{getCommonMistakes(muscle)}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                          Instructional video coming soon
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </section>

      {activeDayComplete && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
        >
          {showCelebration && (
            <motion.div 
               className="pointer-events-none absolute inset-0 flex items-center justify-center"
               initial={{ opacity: 1 }}
               animate={{ opacity: 0 }}
               transition={{ duration: 2, delay: 1 }}
            >
               <motion.div 
                 initial={{ scale: 0, opacity: 1 }}
                 animate={{ scale: 2, opacity: 0 }}
                 transition={{ duration: 1 }}
                 className="h-full w-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)]"
               />
            </motion.div>
          )}

          <div className="relative z-10 flex flex-col items-center gap-4">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            >
              <Check className="h-8 w-8" />
            </motion.div>
            
            <div>
              <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-500">
                ✓ Completed
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Amazing effort! You&apos;ve crushed today&apos;s workout. Keep up the great consistency.
              </p>
            </div>
            
            <div className="mt-4 grid w-full max-w-lg grid-cols-2 gap-4 md:grid-cols-3">
               <div className="rounded-xl border border-emerald-500/20 bg-background/50 p-4">
                 <p className="mb-1 text-xs text-muted-foreground">Calories Burned</p>
                 <p className="text-xl font-bold text-emerald-500"><AnimatedNumber value={activeDayCalories} /> kcal</p>
               </div>
               <div className="rounded-xl border border-emerald-500/20 bg-background/50 p-4">
                 <p className="mb-1 text-xs text-muted-foreground">Duration</p>
                 <p className="text-xl font-bold text-emerald-500">{activeDay.duration} min</p>
               </div>
               <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-background/50 p-4 md:col-span-1">
                 <p className="mb-1 text-xs text-muted-foreground">Completion Time</p>
                 <p className="text-xl font-bold text-emerald-500">
                   {new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(new Date())}
                 </p>
               </div>
            </div>

            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-8 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "This week", value: `${plan.workoutDaysPerWeek} sessions`, icon: Calendar },
          { label: "Session length", value: `${plan.estimatedDuration} min`, icon: Clock },
          { label: "Goal", value: plan.goal, icon: Target },
          { label: "Estimated burn", value: `${activeDayCalories} kcal`, icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-card p-4 shadow-xl md:bottom-8 md:right-8"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-500">🎉 Workout Complete!</p>
              <p className="mt-1 text-sm text-muted-foreground">Great job! Today&apos;s workout has been completed.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
