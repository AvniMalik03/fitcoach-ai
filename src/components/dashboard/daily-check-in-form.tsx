"use client";

import { startTransition, useActionState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Battery, Bed, CheckCircle2, HeartPulse, Loader2, Moon, Smile, Sparkles, Weight, Zap, type LucideIcon } from "lucide-react";
import { submitDailyCheckIn, type CheckInActionState, type SerializedCheckIn } from "@/lib/actions/checkin";
import { checkInSchema, type CheckInInput } from "@/lib/validations/checkin";

const initialState: CheckInActionState = {};
const moods = ["Calm", "Focused", "Stressed", "Tired", "Happy", "Flat"];

function numberDefault(value: number | null | undefined, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function SliderField({
  label,
  value,
  register,
  name,
  icon: Icon,
}: {
  label: string;
  value: number;
  register: ReturnType<typeof useForm<CheckInInput>>["register"];
  name: "energyLevel" | "soreness" | "motivation";
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        {...register(name)}
        className="h-2 w-full accent-primary"
      />
    </div>
  );
}

export function DailyCheckInForm({ latestCheckIn }: { latestCheckIn: SerializedCheckIn | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDailyCheckIn, initialState);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckInInput>({
    resolver: zodResolver(checkInSchema) as Resolver<CheckInInput>,
    defaultValues: {
      weight: latestCheckIn?.weight ?? "",
      sleepHours: latestCheckIn?.sleepHours ?? 7,
      energyLevel: latestCheckIn?.energyLevel ?? 6,
      soreness: latestCheckIn?.soreness ?? 4,
      motivation: latestCheckIn?.motivation ?? 6,
      mood: latestCheckIn?.mood ?? "Focused",
      workoutCompleted: latestCheckIn?.workoutCompleted ?? false,
      notes: latestCheckIn?.notes ?? "",
    },
  });

  const energy = numberDefault(useWatch({ control, name: "energyLevel" }) as number, 6);
  const soreness = numberDefault(useWatch({ control, name: "soreness" }) as number, 4);
  const motivation = numberDefault(useWatch({ control, name: "motivation" }) as number, 6);
  const selectedMood = useWatch({ control, name: "mood" });

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === "") return;
      if (key === "workoutCompleted") {
        if (value) formData.append(key, "on");
        return;
      }
      formData.append(key, String(value));
    });

    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Daily Readiness</h2>
              <p className="mt-1 text-xs text-muted-foreground">Sleep, energy, soreness, and motivation</p>
            </div>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-border bg-background/40 p-5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Weight className="h-4 w-4 text-cyan-400" />
                Weight
              </span>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Optional"
                  {...register("weight")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
              {errors.weight && <p className="mt-2 text-xs text-destructive">{errors.weight.message}</p>}
            </label>

            <label className="rounded-2xl border border-border bg-background/40 p-5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Bed className="h-4 w-4 text-violet-400" />
                Sleep
              </span>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  {...register("sleepHours")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">hrs</span>
              </div>
              {errors.sleepHours && <p className="mt-2 text-xs text-destructive">{errors.sleepHours.message}</p>}
            </label>

            <SliderField label="Energy" value={energy} register={register} name="energyLevel" icon={Battery} />
            <SliderField label="Soreness" value={soreness} register={register} name="soreness" icon={HeartPulse} />
            <SliderField label="Motivation" value={motivation} register={register} name="motivation" icon={Zap} />

            <div className="rounded-2xl border border-border bg-background/40 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Smile className="h-4 w-4 text-emerald-400" />
                Mood
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setValue("mood", mood, { shouldDirty: true })}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      selectedMood === mood
                        ? "border-primary gradient-bg text-white"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register("mood")} />
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow">
            <Moon className="h-4 w-4 text-white" />
          </div>
          <h2 className="mt-5 text-sm font-semibold">Training Context</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            This helps FitCoach AI adapt today&apos;s intensity and recovery guidance.
          </p>

          <label className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
            <input type="checkbox" {...register("workoutCompleted")} className="h-4 w-4 accent-primary" />
            <span className="text-sm font-medium">Workout completed today</span>
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
            <textarea
              rows={6}
              placeholder="Anything your coach should know?"
              {...register("notes")}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>
          {errors.notes && <p className="mt-2 text-xs text-destructive">{errors.notes.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-bg px-4 py-3 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Check-in
          </button>
        </motion.aside>
      </div>
    </form>
  );
}
