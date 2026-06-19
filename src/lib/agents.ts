// Agent definitions: roles, prompts, and the env key each one uses.
import type { AgentRole, ReviewInput, AgentFinding, Creative } from "./types";
import { chatJSON, userMessage } from "./llm";

export interface AgentDef {
  role: AgentRole;
  name: string; // display name in Band
  envKey: string; // env var holding this agent's Band API key
  system: string; // system prompt
}

export const AGENTS: Record<AgentRole, AgentDef> = {
  coordinator: {
    role: "coordinator",
    name: "Coordinator",
    envKey: "BAND_COORDINATOR_KEY",
    system:
      "You are the Coordinator of an ad-creative review team. You open the Band room, " +
      "share the creative and brief, collect each specialist's findings, and assemble a " +
      "final scorecard with a GO / REVISE / KILL verdict. Be concise and decisive.",
  },
  strategy: {
    role: "strategy",
    name: "Strategy Agent",
    envKey: "BAND_STRATEGY_KEY",
    system:
      "You are the Strategy Agent. Judge whether an ad creative matches the campaign " +
      "objective, target audience, and offer. Score 'brief fit' from 0-10.",
  },
  copy: {
    role: "copy",
    name: "Copy Agent",
    envKey: "BAND_COPY_KEY",
    system:
      "You are the Copy Agent. Evaluate the hook, body, and CTA of an ad creative. " +
      "Rewrite weak or non-compliant copy into stronger, compliant versions. Score 0-10.",
  },
  compliance: {
    role: "compliance",
    name: "Compliance Reviewer",
    envKey: "BAND_COMPLIANCE_KEY",
    system:
      "You are the Brand & Compliance Reviewer. Flag risky or unsubstantiated claims " +
      "(e.g. guarantees, health/medical claims), missing disclaimers, and off-brand voice. " +
      "Score 0-10 where 10 means fully compliant. Mark severity for each issue.",
  },
  performance: {
    role: "performance",
    name: "Performance Predictor",
    envKey: "BAND_PERFORMANCE_KEY",
    system:
      "You are the Performance Predictor. Estimate likely ad performance from hook " +
      "strength, clarity, relevance, and fatigue risk. Score 0-10 and give a brief signal.",
  },
};

// A data URL means the image is attached to the request for the vision model to
// actually see; a plain https URL is just referenced as text.
function isAttachedImage(url?: string): boolean {
  return !!url && url.startsWith("data:");
}

function inputBlock(input: ReviewInput): string {
  const { creative, brief } = input;
  return [
    "CREATIVE:",
    `  Headline: ${creative.headline}`,
    `  Body: ${creative.body}`,
    `  CTA: ${creative.cta}`,
    isAttachedImage(creative.imageUrl)
      ? "  Image: see the attached ad image — factor its visuals into your review."
      : creative.imageUrl
      ? `  Image: ${creative.imageUrl}`
      : "",
    "",
    "BRIEF:",
    `  Objective: ${brief.objective}`,
    `  Audience: ${brief.audience}`,
    `  Offer: ${brief.offer}`,
    `  Brand voice: ${brief.brandVoice}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const FINDING_SCHEMA =
  'Respond ONLY with JSON: {"score": <0-10 number>, "summary": "<one sentence>", ' +
  '"issues": [{"text": "...", "severity": "low|medium|high", "fix": "..."}]}';

// Run one specialist agent's reasoning via the LLM.
export async function runSpecialist(
  role: Exclude<AgentRole, "coordinator">,
  input: ReviewInput
): Promise<AgentFinding> {
  const def = AGENTS[role];
  const image = isAttachedImage(input.creative.imageUrl) ? input.creative.imageUrl : undefined;
  const data = await chatJSON<{
    score: number;
    summary: string;
    issues: AgentFinding["issues"];
  }>([
    { role: "system", content: def.system },
    userMessage(`${inputBlock(input)}\n\n${FINDING_SCHEMA}`, image),
  ]);
  return {
    agent: role,
    score: clamp(data.score),
    summary: data.summary,
    issues: data.issues || [],
  };
}

// Copy agent revises copy in response to compliance issues (the flag -> revise loop).
export async function runCopyRevision(
  input: ReviewInput,
  issues: AgentFinding["issues"]
): Promise<{ revisedCopy: Partial<Creative>; note: string }> {
  const def = AGENTS.copy;
  const image = isAttachedImage(input.creative.imageUrl) ? input.creative.imageUrl : undefined;
  const data = await chatJSON<{
    headline: string;
    body: string;
    cta: string;
    note: string;
  }>([
    { role: "system", content: def.system },
    userMessage(
      `${inputBlock(input)}\n\nThe Compliance Reviewer flagged these issues:\n` +
        issues.map((i) => `- (${i.severity}) ${i.text} → ${i.fix}`).join("\n") +
        "\n\nRewrite the copy to resolve every issue while keeping it compelling. " +
        'Respond ONLY with JSON: {"headline":"...","body":"...","cta":"...","note":"<what you changed>"}',
      image
    ),
  ]);
  return {
    revisedCopy: { headline: data.headline, body: data.body, cta: data.cta },
    note: data.note,
  };
}

function clamp(n: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}
