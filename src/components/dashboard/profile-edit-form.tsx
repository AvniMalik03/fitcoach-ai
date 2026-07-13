"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { submitOnboarding } from "@/lib/actions/onboarding";

const equipmentOptions = [
  "No Equipment (Bodyweight)",
  "Dumbbells",
  "Kettlebells",
  "Resistance Bands",
  "Barbell & Plates",
  "Pull-up Bar",
  "Full Gym Access",
];

export function ProfileEditForm({ defaultValues }: { defaultValues: Partial<OnboardingInput> }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, control } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingInput>,
    defaultValues,
  });

  const onSubmit = async (data: OnboardingInput) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await submitOnboarding(data);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-card border border-border p-6 rounded-2xl">
      {message && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${message.type === "success" ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
          {message.type === "success" && <Check className="h-4 w-4" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Personal Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input {...register("name")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Age</label>
            <input type="number" {...register("age")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
            {errors.age && <p className="text-destructive text-xs mt-1">{errors.age.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Gender</label>
            <select {...register("gender")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Height (cm)</label>
            <input type="number" {...register("heightCm")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
            {errors.heightCm && <p className="text-destructive text-xs mt-1">{errors.heightCm.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Weight (kg)</label>
            <input type="number" step="0.1" {...register("weightKg")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
            {errors.weightKg && <p className="text-destructive text-xs mt-1">{errors.weightKg.message}</p>}
          </div>
        </div>
      </section>

      {/* Fitness Profile */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold tracking-tight">Fitness Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Fitness Level</label>
            <select {...register("fitnessLevel")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Activity Level</label>
            <select {...register("activityLevel")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="Sedentary">Sedentary</option>
              <option value="Lightly Active">Lightly Active</option>
              <option value="Moderately Active">Moderately Active</option>
              <option value="Very Active">Very Active</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Primary Goal</label>
            <select {...register("fitnessGoal")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Maintenance">Maintenance / Health</option>
              <option value="Strength">Strength</option>
              <option value="Endurance">Endurance</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Target Weight (kg)</label>
            <input type="number" step="0.1" {...register("goalWeight")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
      </section>

      {/* Workout Preferences */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold tracking-tight">Workout Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Days / Week</label>
            <input type="number" {...register("workoutDaysPerWeek")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">Mins / Session</label>
            <input type="number" {...register("workoutDuration")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">Preferred Time</label>
            <select {...register("preferredWorkoutTime")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Available Equipment</label>
          <Controller
            name="equipment"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {equipmentOptions.map((eq) => (
                  <label key={eq} className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${field.value.includes(eq) ? 'bg-primary/10 border-primary' : 'border-border'}`}>
                    <input
                      type="checkbox"
                      value={eq}
                      checked={field.value.includes(eq)}
                      onChange={(e) => {
                        const updated = e.target.checked 
                          ? [...field.value, eq]
                          : field.value.filter((v: string) => v !== eq);
                        field.onChange(updated);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium">{eq}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.equipment && <p className="text-destructive text-xs mt-1">{errors.equipment.message}</p>}
        </div>
      </section>

      {/* Nutrition & Health */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold tracking-tight">Nutrition & Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Dietary Preference</label>
            <select {...register("dietaryPref")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="None">None (Omnivore)</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Pescatarian">Pescatarian</option>
              <option value="Keto">Keto</option>
              <option value="Paleo">Paleo</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Food Allergies</label>
            <input {...register("foodAllergies")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">Food Restrictions</label>
            <input {...register("foodRestrictions")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">Past Injuries</label>
            <input {...register("injuries")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Medical Conditions</label>
            <input {...register("medicalConditions")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>
      </section>

      <div className="pt-4 border-t border-border flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 shadow-md disabled:opacity-50 transition-colors"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
