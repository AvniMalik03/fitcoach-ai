import { z } from "zod";

export const checkInSchema = z.object({
  weight: z.coerce.number().min(20, "Weight must be at least 20 kg").max(500).optional().or(z.literal("")),
  sleepHours: z.coerce.number().min(0, "Sleep cannot be negative").max(24, "Sleep must be 24 hours or less"),
  energyLevel: z.coerce.number().int().min(1).max(10),
  soreness: z.coerce.number().int().min(1).max(10),
  motivation: z.coerce.number().int().min(1).max(10),
  mood: z.string().max(40).optional(),
  workoutCompleted: z.coerce.boolean(),
  notes: z.string().max(500).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
