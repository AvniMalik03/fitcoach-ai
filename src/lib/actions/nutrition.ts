"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateWeekOneNutrition } from "@/lib/nutrition/generator";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type GenerateNutritionState = {
  success?: boolean;
  error?: string;
};

export type WaterIntakeState = {
  success?: boolean;
  error?: string;
  waterIntakeMl?: number;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function revalidateNutritionViews() {
  revalidatePath("/dashboard/nutrition");
  revalidatePath("/dashboard");
}

export async function generateNutritionPlan(
  _prevState: GenerateNutritionState = {}
): Promise<GenerateNutritionState> {
  void _prevState;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to generate your nutrition plan." };
    }

    const existingPlan = await prisma.nutritionPlan.findUnique({
      where: {
        userId_weekNumber: {
          userId: session.user.id,
          weekNumber: 1,
        },
      },
    });

    if (existingPlan) {
      return { error: "Your Week 1 nutrition plan already exists." };
    }

    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return { error: "Complete onboarding before generating your nutrition plan." };
    }

    const plan = generateWeekOneNutrition(profile);

    await prisma.nutritionPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: plan.weekNumber,
        title: plan.title,
        targetCalories: plan.targetCalories,
        proteinGoal: plan.proteinGoal,
        carbsGoal: plan.carbsGoal,
        fatGoal: plan.fatGoal,
        waterGoalMl: plan.waterGoalMl,
        planJson: JSON.stringify(plan),
      },
    });

    revalidateNutritionViews();

    return { success: true };
  } catch (error) {
    console.error("========== NUTRITION GENERATION ERROR ==========");
    console.error(error);
    console.error("================================================");

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Your Week 1 nutrition plan already exists." };
    }

    return {
      error: "We could not generate your nutrition plan right now. Please try again.",
    };
  }
}

export async function addWaterIntake({
  amountMl,
  dateIso,
}: {
  amountMl: number;
  dateIso?: string;
}): Promise<WaterIntakeState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to update water intake." };
    }

    if (!Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 2000) {
      return { error: "Choose a valid water amount." };
    }

    const date = startOfDay(dateIso ? new Date(dateIso) : new Date());

    const log = await prisma.nutritionLog.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
      create: {
        userId: session.user.id,
        date,
        waterIntakeMl: amountMl,
      },
      update: {
        waterIntakeMl: {
          increment: amountMl,
        },
      },
    });

    revalidateNutritionViews();

    return {
      success: true,
      waterIntakeMl: log.waterIntakeMl,
    };
  } catch (error) {
    console.error("========== WATER INTAKE ERROR ==========");
    console.error(error);
    console.error("========================================");

    return { error: "We could not update water intake. Please try again." };
  }
}
