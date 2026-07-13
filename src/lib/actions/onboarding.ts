"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema, type OnboardingInput } from "../validations/onboarding";

export async function submitOnboarding(input: OnboardingInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const data = parsed.data;

    // Convert goalWeight to null if it's empty string
    const goalWeight = typeof data.goalWeight === "number" ? data.goalWeight : null;

    await prisma.$transaction(async (tx) => {
      // 1. Update User name and status
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: data.name,
          onboardingCompleted: true,
        },
      });

      // 2. Upsert FitnessProfile
      await tx.fitnessProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          age: data.age,
          gender: data.gender,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          fitnessLevel: data.fitnessLevel,
          activityLevel: data.activityLevel,
          fitnessGoal: data.fitnessGoal,
          goalWeight,
          workoutDaysPerWeek: data.workoutDaysPerWeek,
          workoutDuration: data.workoutDuration,
          preferredWorkoutTime: data.preferredWorkoutTime,
          equipment: JSON.stringify(data.equipment),
          dietaryPref: data.dietaryPref,
          foodAllergies: data.foodAllergies || null,
          foodRestrictions: data.foodRestrictions || null,
          injuries: data.injuries || null,
          medicalConditions: data.medicalConditions || null,
        },
        update: {
          age: data.age,
          gender: data.gender,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          fitnessLevel: data.fitnessLevel,
          activityLevel: data.activityLevel,
          fitnessGoal: data.fitnessGoal,
          goalWeight,
          workoutDaysPerWeek: data.workoutDaysPerWeek,
          workoutDuration: data.workoutDuration,
          preferredWorkoutTime: data.preferredWorkoutTime,
          equipment: JSON.stringify(data.equipment),
          dietaryPref: data.dietaryPref,
          foodAllergies: data.foodAllergies || null,
          foodRestrictions: data.foodRestrictions || null,
          injuries: data.injuries || null,
          medicalConditions: data.medicalConditions || null,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("========== ONBOARDING ERROR ==========");
    console.error(error);
    console.error("=====================================");

    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    };
  }
}
