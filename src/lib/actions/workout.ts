"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateWeekOneWorkout } from "@/lib/workout/generator";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type GenerateWorkoutState = {
  success?: boolean;
  error?: string;
};

export async function generateWorkout(
  _prevState: GenerateWorkoutState = {}
): Promise<GenerateWorkoutState> {
  void _prevState;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to generate your workout plan." };
    }

    const existingPlan = await prisma.workoutPlan.findUnique({
      where: {
        userId_weekNumber: {
          userId: session.user.id,
          weekNumber: 1,
        },
      },
    });

    if (existingPlan) {
      return { error: "Your Week 1 workout plan already exists." };
    }

    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return { error: "Complete onboarding before generating your workout plan." };
    }

    const plan = generateWeekOneWorkout(profile);

    await prisma.workoutPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: plan.weekNumber,
        title: plan.title,
        goal: plan.goal,
        workoutDaysPerWeek: plan.workoutDaysPerWeek,
        estimatedDuration: plan.estimatedDuration,
        planJson: JSON.stringify(plan),
      },
    });

    revalidatePath("/dashboard/workout");

    return { success: true };
  } catch (error) {
    console.error("========== WORKOUT GENERATION ERROR ==========");
    console.error(error);
    console.error("==============================================");

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Your Week 1 workout plan already exists." };
    }

    return {
      error: "We could not generate your workout right now. Please try again.",
    };
  }
}
