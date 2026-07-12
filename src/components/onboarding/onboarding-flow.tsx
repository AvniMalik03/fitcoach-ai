"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, Loader2, Dumbbell } from "lucide-react";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { submitOnboarding } from "@/lib/actions/onboarding";

const steps = [
  { id: "personal", title: "Personal Details" },
  { id: "fitness", title: "Fitness Profile" },
  { id: "workout", title: "Preferences" },
  { id: "nutrition", title: "Nutrition" },
  { id: "health", title: "Health" },
];

const equipmentOptions = [
  "No Equipment (Bodyweight)",
  "Dumbbells",
  "Kettlebells",
  "Resistance Bands",
  "Barbell & Plates",
  "Pull-up Bar",
  "Full Gym Access",
];

export function OnboardingFlow({ defaultName, userEmail }: { defaultName: string; userEmail: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OnboardingInput>({
    // @ts-ignore
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: defaultName,
      equipment: [],
      fitnessGoal: "Weight Loss",
      fitnessLevel: "Beginner",
      activityLevel: "Sedentary",
      preferredWorkoutTime: "Morning",
      dietaryPref: "None",
      gender: "Prefer not to say",
    },
    mode: "onChange",
  });

  const { register, handleSubmit, formState: { errors, isValid }, watch, trigger, control } = form;

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate as any);
    
    if (isStepValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: OnboardingInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await submitOnboarding(data);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }
      // Update NextAuth session so it knows onboarding is complete
      await update({ onboardingCompleted: true });
      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 0: return ["name", "age", "gender", "heightCm", "weightKg"];
      case 1: return ["fitnessLevel", "activityLevel", "fitnessGoal", "goalWeight"];
      case 2: return ["workoutDaysPerWeek", "workoutDuration", "preferredWorkoutTime", "equipment"];
      case 3: return ["dietaryPref", "foodAllergies", "foodRestrictions"];
      case 4: return ["injuries", "medicalConditions"];
      default: return [];
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border overflow-hidden">
      {/* Header & Progress */}
      <div className="px-8 pt-8 pb-6 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 mb-6 text-primary">
          <Dumbbell className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">FitCoach AI</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {steps[currentStep].title}
          </h1>
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-[400px]">
        <div className="flex-1 p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {error && (
                <div className="p-3 mb-4 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Step 1 */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <input {...register("name")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1" />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Age</label>
                      <input type="number" {...register("age")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      {errors.age && <p className="text-destructive text-xs mt-1">{errors.age.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Gender</label>
                      <select {...register("gender")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      {errors.gender && <p className="text-destructive text-xs mt-1">{errors.gender.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Height (cm)</label>
                      <input type="number" {...register("heightCm")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      {errors.heightCm && <p className="text-destructive text-xs mt-1">{errors.heightCm.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Weight (kg)</label>
                      <input type="number" step="0.1" {...register("weightKg")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      {errors.weightKg && <p className="text-destructive text-xs mt-1">{errors.weightKg.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Fitness Level</label>
                    <select {...register("fitnessLevel")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Beginner">Beginner (New to working out)</option>
                      <option value="Intermediate">Intermediate (Some experience)</option>
                      <option value="Advanced">Advanced (Consistent training)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Daily Activity Level</label>
                    <select {...register("activityLevel")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Sedentary">Sedentary (Office job, mostly sitting)</option>
                      <option value="Lightly Active">Lightly Active (Walking, light chores)</option>
                      <option value="Moderately Active">Moderately Active (Active job or regular sports)</option>
                      <option value="Very Active">Very Active (Physical labor, hard training)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Primary Goal</label>
                    <select {...register("fitnessGoal")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Maintenance">Maintenance / Health</option>
                      <option value="Strength">Strength</option>
                      <option value="Endurance">Endurance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Target Weight (kg) - Optional</label>
                    <input type="number" step="0.1" {...register("goalWeight")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Leave blank if no target" />
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Days / Week</label>
                      <input type="number" {...register("workoutDaysPerWeek")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      {errors.workoutDaysPerWeek && <p className="text-destructive text-xs mt-1">{errors.workoutDaysPerWeek.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Minutes / Session</label>
                      <input type="number" {...register("workoutDuration")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      {errors.workoutDuration && <p className="text-destructive text-xs mt-1">{errors.workoutDuration.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Preferred Time</label>
                    <select {...register("preferredWorkoutTime")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Available Equipment</label>
                    <Controller
                      name="equipment"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {equipmentOptions.map((eq) => (
                            <label key={eq} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${field.value.includes(eq) ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'}`}>
                              <input
                                type="checkbox"
                                value={eq}
                                checked={field.value.includes(eq)}
                                onChange={(e) => {
                                  const updated = e.target.checked 
                                    ? [...field.value, eq]
                                    : field.value.filter(v => v !== eq);
                                  field.onChange(updated);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-medium">{eq}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.equipment && <p className="text-destructive text-xs mt-2">{errors.equipment.message}</p>}
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Dietary Preference</label>
                    <select {...register("dietaryPref")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="None">None (Omnivore)</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Pescatarian">Pescatarian</option>
                      <option value="Keto">Keto</option>
                      <option value="Paleo">Paleo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Food Allergies</label>
                    <input {...register("foodAllergies")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="E.g. Peanuts, Shellfish..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Other Restrictions</label>
                    <input {...register("foodRestrictions")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="E.g. Lactose intolerant, Halal..." />
                  </div>
                </div>
              )}

              {/* Step 5 */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Past or Current Injuries</label>
                    <textarea {...register("injuries")} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" placeholder="E.g. Lower back pain, torn ACL in 2020..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
                    <textarea {...register("medicalConditions")} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" placeholder="E.g. Asthma, Hypertension..." />
                  </div>
                  
                  <div className="p-4 bg-primary/10 rounded-lg mt-6 flex items-start gap-3 border border-primary/20">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">You're all set!</p>
                      <p className="text-xs text-muted-foreground mt-1">Our AI will use this information to generate a highly personalized plan designed specifically for your body and goals.</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground ${currentStep === 0 ? "invisible" : ""}`}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 shadow-md shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  Complete Profile
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
