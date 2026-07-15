import type { FitnessProfile } from "@prisma/client";

export type NutritionMeal = {
  type: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
};

export type WeekOneNutritionPlan = {
  weekNumber: 1;
  title: string;
  goal: string;
  dietaryPref: string;
  targetCalories: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoalMl: number;
  meals: NutritionMeal[];
};

type MealTemplate = {
  name: string;
  ingredients: string[];
  proteinBias: number;
  carbBias: number;
  fatBias: number;
};

const mealTemplates: Record<string, Record<NutritionMeal["type"], MealTemplate[]>> = {
  balanced: {
    Breakfast: [
      {
        name: "Greek Yogurt Power Bowl",
        ingredients: ["Greek yogurt", "rolled oats", "banana", "chia seeds", "mixed berries"],
        proteinBias: 0.22,
        carbBias: 0.52,
        fatBias: 0.26,
      },
      {
        name: "Egg and Oat Breakfast Plate",
        ingredients: ["eggs", "oatmeal", "spinach", "apple", "almonds"],
        proteinBias: 0.28,
        carbBias: 0.45,
        fatBias: 0.27,
      },
    ],
    Lunch: [
      {
        name: "Grilled Chicken Rice Bowl",
        ingredients: ["chicken breast", "brown rice", "broccoli", "olive oil", "lemon dressing"],
        proteinBias: 0.34,
        carbBias: 0.46,
        fatBias: 0.2,
      },
      {
        name: "Turkey Quinoa Salad",
        ingredients: ["turkey", "quinoa", "cucumber", "tomatoes", "avocado"],
        proteinBias: 0.32,
        carbBias: 0.42,
        fatBias: 0.26,
      },
    ],
    Dinner: [
      {
        name: "Salmon Sweet Potato Plate",
        ingredients: ["salmon", "sweet potato", "green beans", "spinach", "olive oil"],
        proteinBias: 0.3,
        carbBias: 0.38,
        fatBias: 0.32,
      },
      {
        name: "Lean Beef Veggie Stir Fry",
        ingredients: ["lean beef", "jasmine rice", "peppers", "zucchini", "ginger soy sauce"],
        proteinBias: 0.33,
        carbBias: 0.43,
        fatBias: 0.24,
      },
    ],
    Snacks: [
      {
        name: "Cottage Cheese Fruit Snack",
        ingredients: ["cottage cheese", "pineapple", "walnuts", "cinnamon"],
        proteinBias: 0.36,
        carbBias: 0.4,
        fatBias: 0.24,
      },
      {
        name: "Protein Smoothie",
        ingredients: ["protein powder", "milk", "banana", "peanut butter"],
        proteinBias: 0.34,
        carbBias: 0.42,
        fatBias: 0.24,
      },
    ],
  },
  vegetarian: {
    Breakfast: [
      {
        name: "Paneer Veggie Scramble",
        ingredients: ["paneer", "whole-grain toast", "spinach", "tomatoes", "orange"],
        proteinBias: 0.27,
        carbBias: 0.44,
        fatBias: 0.29,
      },
    ],
    Lunch: [
      {
        name: "Chickpea Quinoa Bowl",
        ingredients: ["chickpeas", "quinoa", "cucumber", "yogurt dressing", "pumpkin seeds"],
        proteinBias: 0.24,
        carbBias: 0.52,
        fatBias: 0.24,
      },
    ],
    Dinner: [
      {
        name: "Tofu Lentil Curry Plate",
        ingredients: ["tofu", "lentils", "basmati rice", "cauliflower", "coconut milk"],
        proteinBias: 0.25,
        carbBias: 0.5,
        fatBias: 0.25,
      },
    ],
    Snacks: [
      {
        name: "Hummus and Yogurt Snack Box",
        ingredients: ["hummus", "Greek yogurt", "carrots", "pita", "berries"],
        proteinBias: 0.28,
        carbBias: 0.48,
        fatBias: 0.24,
      },
    ],
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDiet(dietaryPref: string | null) {
  const diet = dietaryPref?.toLowerCase() ?? "";
  return diet.includes("vegetarian") || diet.includes("vegan") ? "vegetarian" : "balanced";
}

function calorieTarget(profile: FitnessProfile) {
  const weight = profile.weightKg ?? 70;
  const height = profile.heightCm ?? 170;
  const age = profile.age ?? 30;
  const genderOffset = profile.gender === "Female" ? -161 : 5;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;

  const activityMultiplier =
    profile.activityLevel === "Very Active"
      ? 1.65
      : profile.activityLevel === "Active"
        ? 1.5
        : profile.activityLevel === "Lightly Active"
          ? 1.35
          : 1.2;

  const goalAdjustment =
    profile.fitnessGoal === "Weight Loss"
      ? -350
      : profile.fitnessGoal === "Muscle Gain" || profile.fitnessGoal === "Strength"
        ? 250
        : 0;

  return Math.round(clamp(bmr * activityMultiplier + goalAdjustment, 1500, 3200) / 25) * 25;
}

function chooseTemplate(
  templates: Record<NutritionMeal["type"], MealTemplate[]>,
  type: NutritionMeal["type"],
  seed: number
) {
  const options = templates[type];
  return options[seed % options.length];
}

function buildMeal(
  type: NutritionMeal["type"],
  calories: number,
  template: MealTemplate
): NutritionMeal {
  return {
    type,
    name: template.name,
    calories,
    protein: Math.round((calories * template.proteinBias) / 4),
    carbs: Math.round((calories * template.carbBias) / 4),
    fat: Math.round((calories * template.fatBias) / 9),
    ingredients: template.ingredients,
  };
}

export function generateWeekOneNutrition(profile: FitnessProfile): WeekOneNutritionPlan {
  const dietKey = normalizeDiet(profile.dietaryPref);
  const templates = mealTemplates[dietKey];
  const targetCalories = calorieTarget(profile);
  const weight = profile.weightKg ?? 70;
  const proteinGoal = Math.round(clamp(weight * (profile.fitnessGoal === "Muscle Gain" ? 2 : 1.6), 90, 210));
  const fatGoal = Math.round(clamp((targetCalories * 0.28) / 9, 45, 100));
  const carbsGoal = Math.round((targetCalories - proteinGoal * 4 - fatGoal * 9) / 4);
  const waterGoalMl = Math.round(clamp(weight * 35, 2000, 4000) / 250) * 250;
  const seed = Math.round((profile.age ?? 30) + weight + (profile.heightCm ?? 170));

  const mealCalories = {
    Breakfast: Math.round(targetCalories * 0.25),
    Lunch: Math.round(targetCalories * 0.32),
    Dinner: Math.round(targetCalories * 0.3),
    Snacks: targetCalories - Math.round(targetCalories * 0.25) - Math.round(targetCalories * 0.32) - Math.round(targetCalories * 0.3),
  } satisfies Record<NutritionMeal["type"], number>;

  const meals = (["Breakfast", "Lunch", "Dinner", "Snacks"] as const).map((type, index) =>
    buildMeal(type, mealCalories[type], chooseTemplate(templates, type, seed + index))
  );

  return {
    weekNumber: 1,
    title: `Week 1 ${profile.fitnessGoal ?? "Balanced"} Nutrition Plan`,
    goal: profile.fitnessGoal ?? "Maintenance",
    dietaryPref: profile.dietaryPref ?? "Balanced",
    targetCalories,
    proteinGoal,
    carbsGoal,
    fatGoal,
    waterGoalMl,
    meals,
  };
}
