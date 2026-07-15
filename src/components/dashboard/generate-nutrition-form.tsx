"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import {
  generateNutritionPlan,
  type GenerateNutritionState,
} from "@/lib/actions/nutrition";

const initialState: GenerateNutritionState = {};

export function GenerateNutritionForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    generateNutritionPlan,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-lg">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">Generate your Week 1 meal plan</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We&apos;ll use your onboarding profile to build daily targets and a practical meal plan.
      </p>

      <form action={formAction} className="mt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-5 py-3 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Meal Plan
        </button>
      </form>

      {state.error && (
        <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}
