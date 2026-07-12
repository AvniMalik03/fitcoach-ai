import { z } from "zod";

export const onboardingSchema = z.object({
  // Step 1: Personal Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(13, "Must be at least 13 years old").max(120),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
  heightCm: z.coerce.number().min(50).max(300),
  weightKg: z.coerce.number().min(20).max(500),

  // Step 2: Fitness Profile
  fitnessLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  activityLevel: z.enum([
    "Sedentary",
    "Lightly Active",
    "Moderately Active",
    "Very Active",
  ]),
  fitnessGoal: z.enum([
    "Weight Loss",
    "Muscle Gain",
    "Maintenance",
    "Strength",
    "Endurance",
  ]),
  goalWeight: z.coerce.number().min(20).max(500).optional().or(z.literal("")),

  // Step 3: Workout Preferences
  workoutDaysPerWeek: z.coerce.number().min(1).max(7),
  workoutDuration: z.coerce.number().min(10).max(180),
  preferredWorkoutTime: z.enum(["Morning", "Afternoon", "Evening"]),
  equipment: z.array(z.string()).min(1, "Select at least one equipment option"),

  // Step 4: Nutrition
  dietaryPref: z.enum([
    "None",
    "Vegetarian",
    "Vegan",
    "Pescatarian",
    "Keto",
    "Paleo",
  ]),
  foodAllergies: z.string().optional(),
  foodRestrictions: z.string().optional(),

  // Step 5: Health
  injuries: z.string().optional(),
  medicalConditions: z.string().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
