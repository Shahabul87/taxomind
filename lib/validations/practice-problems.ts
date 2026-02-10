import { z } from "zod";

export const GeneratePracticeSetSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .default("intermediate"),
  bloomsLevel: z
    .enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"])
    .default("APPLY"),
  count: z.number().int().min(3).max(10).default(5),
  questionTypes: z
    .array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"]))
    .min(1)
    .default(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  learningObjectives: z.array(z.string()).optional().default([]),
});

export const SubmitPracticeAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string(),
      timeSpent: z.number().int().min(0).optional(),
      hintsUsed: z.number().int().min(0).optional().default(0),
    })
  ),
  timeSpent: z.number().int().min(0),
});

export type GeneratePracticeSetInput = z.infer<typeof GeneratePracticeSetSchema>;
export type SubmitPracticeAttemptInput = z.infer<typeof SubmitPracticeAttemptSchema>;
