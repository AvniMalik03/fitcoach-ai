"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { WeekOneWorkoutPlan } from "@/lib/workout/generator";
import type { WorkoutProgress } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type WorkoutProgressState = {
  success?: boolean;
  error?: string;
  progress?: SerializedWorkoutProgress[];
};

export type SerializedWorkoutProgress = {
  id: string;
  workoutPlanId: string;
  userId: string;
  day: string;
  exerciseName: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializeProgress(progress: WorkoutProgress): SerializedWorkoutProgress {
  return {
    ...progress,
    completedAt: progress.completedAt?.toISOString() ?? null,
    createdAt: progress.createdAt.toISOString(),
    updatedAt: progress.updatedAt.toISOString(),
  };
}

async function requireOwnedWorkoutPlan(workoutPlanId: string, userId: string) {
  return prisma.workoutPlan.findFirst({
    where: {
      id: workoutPlanId,
      userId,
    },
    select: {
      id: true,
      planJson: true,
    },
  });
}

function planHasExercise(planJson: string, day: string, exerciseName: string) {
  try {
    const plan = JSON.parse(planJson) as WeekOneWorkoutPlan;
    return plan.days.some(
      (workoutDay) =>
        workoutDay.day === day &&
        workoutDay.exercises.some((exercise) => exercise.name === exerciseName)
    );
  } catch {
    return false;
  }
}

async function listProgress(workoutPlanId: string, userId: string) {
  const progress = await prisma.workoutProgress.findMany({
    where: {
      workoutPlanId,
      userId,
    },
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
  });

  return progress.map(serializeProgress);
}

function revalidateWorkoutViews() {
  revalidatePath("/dashboard/workout");
  revalidatePath("/dashboard");
}

export async function getWorkoutProgress(
  workoutPlanId: string
): Promise<WorkoutProgressState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to view workout progress." };
    }

    const workoutPlan = await requireOwnedWorkoutPlan(workoutPlanId, session.user.id);
    if (!workoutPlan) {
      return { error: "We could not find a workout plan for your account." };
    }

    return {
      success: true,
      progress: await listProgress(workoutPlanId, session.user.id),
    };
  } catch (error) {
    console.error("========== GET WORKOUT PROGRESS ERROR ==========");
    console.error(error);
    console.error("================================================");

    return { error: "We could not load your workout progress right now." };
  }
}

export async function toggleExerciseCompletion({
  workoutPlanId,
  day,
  exerciseName,
  completed,
}: {
  workoutPlanId: string;
  day: string;
  exerciseName: string;
  completed: boolean;
}): Promise<WorkoutProgressState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to update workout progress." };
    }

    const workoutPlan = await requireOwnedWorkoutPlan(workoutPlanId, session.user.id);
    if (!workoutPlan) {
      return { error: "You do not have access to this workout plan." };
    }

    if (!planHasExercise(workoutPlan.planJson, day, exerciseName)) {
      return { error: "We could not find that exercise in your workout plan." };
    }

    await prisma.workoutProgress.upsert({
      where: {
        workoutPlanId_userId_day_exerciseName: {
          workoutPlanId,
          userId: session.user.id,
          day,
          exerciseName,
        },
      },
      create: {
        workoutPlanId,
        userId: session.user.id,
        day,
        exerciseName,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    revalidateWorkoutViews();

    return {
      success: true,
      progress: await listProgress(workoutPlanId, session.user.id),
    };
  } catch (error) {
    console.error("========== TOGGLE EXERCISE COMPLETION ERROR ==========");
    console.error(error);
    console.error("======================================================");

    return { error: "We could not update that exercise. Please try again." };
  }
}

export async function startWorkoutDay({
  workoutPlanId,
  day,
  exerciseNames,
}: {
  workoutPlanId: string;
  day: string;
  exerciseNames: string[];
}): Promise<WorkoutProgressState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to start your workout." };
    }

    const workoutPlan = await requireOwnedWorkoutPlan(workoutPlanId, session.user.id);
    if (!workoutPlan) {
      return { error: "You do not have access to this workout plan." };
    }

    const validExercises = exerciseNames.filter((exerciseName) =>
      planHasExercise(workoutPlan.planJson, day, exerciseName)
    );

    if (validExercises.length !== exerciseNames.length || validExercises.length === 0) {
      return { error: "We could not start that workout day." };
    }

    await prisma.$transaction(
      validExercises.map((exerciseName) =>
        prisma.workoutProgress.upsert({
          where: {
            workoutPlanId_userId_day_exerciseName: {
              workoutPlanId,
              userId: session.user.id,
              day,
              exerciseName,
            },
          },
          create: {
            workoutPlanId,
            userId: session.user.id,
            day,
            exerciseName,
            completed: false,
            completedAt: null,
          },
          update: {},
        })
      )
    );

    revalidateWorkoutViews();

    return {
      success: true,
      progress: await listProgress(workoutPlanId, session.user.id),
    };
  } catch (error) {
    console.error("========== START WORKOUT DAY ERROR ==========");
    console.error(error);
    console.error("=============================================");

    return { error: "We could not start that workout. Please try again." };
  }
}

export async function resetWorkoutDay({
  workoutPlanId,
  day,
}: {
  workoutPlanId: string;
  day: string;
}): Promise<WorkoutProgressState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in to reset workout progress." };
    }

    const workoutPlan = await requireOwnedWorkoutPlan(workoutPlanId, session.user.id);
    if (!workoutPlan) {
      return { error: "You do not have access to this workout plan." };
    }

    await prisma.workoutProgress.updateMany({
      where: {
        workoutPlanId,
        userId: session.user.id,
        day,
      },
      data: {
        completed: false,
        completedAt: null,
      },
    });

    revalidateWorkoutViews();

    return {
      success: true,
      progress: await listProgress(workoutPlanId, session.user.id),
    };
  } catch (error) {
    console.error("========== RESET WORKOUT DAY ERROR ==========");
    console.error(error);
    console.error("=============================================");

    return { error: "We could not reset that workout day. Please try again." };
  }
}
