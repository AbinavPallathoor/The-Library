import type { RecallPrompt, Role } from "../domain/types";
export const buildStudySurface = (p: RecallPrompt, revealed: boolean) =>
  revealed
    ? { question: p.question, answer: p.answer }
    : { question: p.question };
export const eligiblePrompts = (prompts: RecallPrompt[]) =>
  prompts.filter((p) => p.enrolled && p.evidence !== "tentative");
export function renderTemplate(role: Role, sections: Record<string, string>) {
  return (
    Object.entries(sections)
      .filter(([, v]) => v.trim())
      .map(
        ([k, v]) =>
          "## " + k.charAt(0).toUpperCase() + k.slice(1) + "\n\n" + v.trim(),
      )
      .join("\n\n") + "\n"
  );
}
