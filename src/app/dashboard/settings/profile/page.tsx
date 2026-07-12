import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.fitnessProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  // Parse equipment JSON back to array
  let equipment = [];
  try {
    equipment = profile.equipment ? JSON.parse(profile.equipment) : [];
  } catch (e) {
    console.error("Failed to parse equipment JSON");
  }

  const defaultValues = {
    name: session.user.name || "",
    age: profile.age || undefined,
    gender: profile.gender || "",
    heightCm: profile.heightCm || undefined,
    weightKg: profile.weightKg || undefined,
    fitnessLevel: profile.fitnessLevel || "",
    activityLevel: profile.activityLevel || "",
    fitnessGoal: profile.fitnessGoal || "",
    goalWeight: profile.goalWeight || undefined,
    workoutDaysPerWeek: profile.workoutDaysPerWeek || undefined,
    workoutDuration: profile.workoutDuration || undefined,
    preferredWorkoutTime: profile.preferredWorkoutTime || "",
    equipment,
    dietaryPref: profile.dietaryPref || "",
    foodAllergies: profile.foodAllergies || "",
    foodRestrictions: profile.foodRestrictions || "",
    injuries: profile.injuries || "",
    medicalConditions: profile.medicalConditions || "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your fitness goals, measurements, and preferences.
        </p>
      </div>

      <ProfileEditForm defaultValues={defaultValues} />
    </div>
  );
}
