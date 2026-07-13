import type { FitnessProfile } from "@prisma/client";

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  restTime: string;
};

export type WorkoutDay = {
  day: string;
  focus: string;
  duration: number;
  difficulty: "Easy" | "Moderate" | "Hard";
  warmup: string;
  cooldown: string;
  exercises: WorkoutExercise[];
};

export type WeekOneWorkoutPlan = {
  weekNumber: 1;
  title: string;
  goal: string;
  fitnessLevel: string;
  workoutDaysPerWeek: number;
  estimatedDuration: number;
  equipment: string[];
  days: WorkoutDay[];
};

type ExerciseTemplate = {
  bodyweight: string;
  dumbbells: string;
  bands: string;
  gym: string;
};

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const templates: Record<string, ExerciseTemplate[]> = {
  push: [
    { bodyweight: "Incline Push-up", dumbbells: "Dumbbell Floor Press", bands: "Band Chest Press", gym: "Machine Chest Press" },
    { bodyweight: "Pike Push-up", dumbbells: "Dumbbell Shoulder Press", bands: "Band Shoulder Press", gym: "Seated Shoulder Press" },
    { bodyweight: "Chair Triceps Dip", dumbbells: "Dumbbell Triceps Extension", bands: "Band Triceps Pressdown", gym: "Cable Triceps Pressdown" },
  ],
  pull: [
    { bodyweight: "Prone W Raise", dumbbells: "One-arm Dumbbell Row", bands: "Seated Band Row", gym: "Lat Pulldown" },
    { bodyweight: "Reverse Snow Angel", dumbbells: "Dumbbell Rear Delt Fly", bands: "Band Face Pull", gym: "Cable Face Pull" },
    { bodyweight: "Towel Curl Isometric", dumbbells: "Dumbbell Curl", bands: "Band Curl", gym: "Cable Curl" },
  ],
  legs: [
    { bodyweight: "Bodyweight Squat", dumbbells: "Goblet Squat", bands: "Band Squat", gym: "Leg Press" },
    { bodyweight: "Reverse Lunge", dumbbells: "Dumbbell Reverse Lunge", bands: "Band Reverse Lunge", gym: "Walking Lunge" },
    { bodyweight: "Glute Bridge", dumbbells: "Dumbbell Hip Thrust", bands: "Band Glute Bridge", gym: "Hip Thrust Machine" },
  ],
  core: [
    { bodyweight: "Dead Bug", dumbbells: "Weighted Dead Bug", bands: "Band Pallof Press", gym: "Cable Pallof Press" },
    { bodyweight: "Forearm Plank", dumbbells: "Dumbbell Plank Pull-through", bands: "Band Plank Row", gym: "Stability Ball Plank" },
  ],
  conditioning: [
    { bodyweight: "Low-impact Mountain Climber", dumbbells: "Dumbbell March", bands: "Band Squat to Row", gym: "Rowing Machine" },
    { bodyweight: "Step Jack", dumbbells: "Dumbbell Farmer March", bands: "Band Lateral Walk", gym: "Incline Treadmill Walk" },
  ],
};

function parseEquipment(equipment: string | null): string[] {
  if (!equipment) return ["No Equipment (Bodyweight)"];

  try {
    const parsed = JSON.parse(equipment);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["No Equipment (Bodyweight)"];
  } catch {
    return ["No Equipment (Bodyweight)"];
  }
}

function equipmentKey(equipment: string[]) {
  const normalized = equipment.join(" ").toLowerCase();

  if (normalized.includes("full gym") || normalized.includes("barbell") || normalized.includes("pull-up")) {
    return "gym" as const;
  }

  if (normalized.includes("dumbbell") || normalized.includes("kettlebell")) {
    return "dumbbells" as const;
  }

  if (normalized.includes("resistance band")) {
    return "bands" as const;
  }

  return "bodyweight" as const;
}

function prescription(level: string | null, goal: string | null) {
  const normalizedLevel = level ?? "Beginner";
  const normalizedGoal = goal ?? "Maintenance";

  if (normalizedLevel === "Advanced") {
    return {
      sets: normalizedGoal === "Strength" ? 5 : 4,
      reps: normalizedGoal === "Endurance" || normalizedGoal === "Weight Loss" ? "12-18" : "6-10",
      restTime: normalizedGoal === "Strength" ? "90 sec" : "60 sec",
      difficulty: "Hard" as const,
    };
  }

  if (normalizedLevel === "Intermediate") {
    return {
      sets: normalizedGoal === "Strength" ? 4 : 3,
      reps: normalizedGoal === "Endurance" || normalizedGoal === "Weight Loss" ? "10-15" : "8-12",
      restTime: normalizedGoal === "Strength" ? "75 sec" : "45 sec",
      difficulty: "Moderate" as const,
    };
  }

  return {
    sets: 2,
    reps: normalizedGoal === "Endurance" || normalizedGoal === "Weight Loss" ? "10-12" : "8-10",
    restTime: "60 sec",
    difficulty: "Easy" as const,
  };
}

function focusSequence(goal: string | null, daysPerWeek: number) {
  if (goal === "Muscle Gain" || goal === "Strength") {
    return ["Upper Strength", "Lower Strength", "Push + Core", "Pull + Legs", "Full Body Strength"].slice(0, daysPerWeek);
  }

  if (goal === "Endurance" || goal === "Weight Loss") {
    return ["Full Body Conditioning", "Lower Body + Core", "Upper Body Circuit", "Cardio Strength", "Metabolic Full Body"].slice(0, daysPerWeek);
  }

  return ["Full Body Foundation", "Lower Body", "Upper Body", "Core + Conditioning", "Full Body Balance"].slice(0, daysPerWeek);
}

function categoriesForFocus(focus: string) {
  const normalized = focus.toLowerCase();

  if (normalized.includes("upper")) return ["push", "pull", "core"];
  if (normalized.includes("lower")) return ["legs", "core", "conditioning"];
  if (normalized.includes("push")) return ["push", "core", "conditioning"];
  if (normalized.includes("pull")) return ["pull", "legs", "core"];
  if (normalized.includes("cardio") || normalized.includes("conditioning") || normalized.includes("metabolic")) {
    return ["conditioning", "legs", "core"];
  }

  return ["legs", "push", "pull", "core"];
}

function buildExercises(focus: string, profile: FitnessProfile, equipment: string[]): WorkoutExercise[] {
  const key = equipmentKey(equipment);
  const { sets, reps, restTime } = prescription(profile.fitnessLevel, profile.fitnessGoal);

  return categoriesForFocus(focus).flatMap((category) =>
    templates[category].slice(0, category === "core" ? 1 : 2).map((template) => ({
      name: template[key],
      sets,
      reps: category === "core" ? (profile.fitnessLevel === "Advanced" ? "45-60 sec" : "30-45 sec") : reps,
      restTime: category === "conditioning" ? "30 sec" : restTime,
    }))
  );
}

export function generateWeekOneWorkout(profile: FitnessProfile): WeekOneWorkoutPlan {
  const equipment = parseEquipment(profile.equipment);
  const workoutDaysPerWeek = Math.min(Math.max(profile.workoutDaysPerWeek ?? 3, 1), 5);
  const estimatedDuration = profile.workoutDuration ?? 45;
  const goal = profile.fitnessGoal ?? "Maintenance";
  const focusDays = focusSequence(goal, workoutDaysPerWeek);
  const basePrescription = prescription(profile.fitnessLevel, goal);

  return {
    weekNumber: 1,
    title: `Week 1 ${goal} Workout Plan`,
    goal,
    fitnessLevel: profile.fitnessLevel ?? "Beginner",
    workoutDaysPerWeek,
    estimatedDuration,
    equipment,
    days: focusDays.map((focus, index) => ({
      day: dayNames[Math.min(index * Math.floor(7 / workoutDaysPerWeek), dayNames.length - 1)],
      focus,
      duration: estimatedDuration,
      difficulty: basePrescription.difficulty,
      warmup: "5 minutes easy movement plus dynamic mobility",
      cooldown: "5 minutes light stretching and breathing",
      exercises: buildExercises(focus, profile, equipment),
    })),
  };
}
