import { z } from "zod";
import { validateRoute } from "./core";
export const pathSchema = z
  .string()
  .refine(
    (p) => validateRoute(p).ok,
    "Expected a relative Markdown path outside hidden folders",
  );
export const roleSchema = z.enum(["learning", "idea", "reference"]);
export const promptSchema = z
  .object({
    id: z.string().min(1),
    notePath: pathSchema,
    question: z.string().min(1),
    answer: z.string().min(1),
    kind: z.enum(["explain", "compare", "draw", "apply", "fact"]),
    evidence: z.enum(["user-statement", "source-backed", "tentative"]),
    enrolled: z.boolean(),
  })
  .strict()
  .refine(
    (p) => !(p.evidence === "tentative" && p.enrolled),
    "A tentative prompt cannot be enrolled",
  );
export const draftSchema = z
  .object({
    id: z.string().min(1),
    mode: z.enum(["new-learning", "recall", "idea", "reference"]),
    sourceRefs: z.array(z.string()),
    explicitCourseCode: z.string().optional(),
    writes: z
      .array(
        z
          .object({
            path: pathSchema,
            expectedRevision: z
              .string()
              .regex(/^[a-f0-9]{64}$/)
              .nullable(),
            markdown: z.string().max(500000),
            role: roleSchema,
          })
          .strict(),
      )
      .max(100),
    topicLinks: z.array(
      z
        .object({
          hubPath: pathSchema,
          notePath: pathSchema,
          heading: z.string().optional(),
        })
        .strict(),
    ),
    prompts: z.array(promptSchema),
    corrections: z.array(z.string()),
    questions: z.array(z.string()),
  })
  .strict();
export const changeSchema = draftSchema.extend({ vaultId: z.string().min(1) });
