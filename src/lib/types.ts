// Shared types for AdVerdict.

export interface Creative {
  imageUrl?: string;
  headline: string;
  body: string;
  cta: string;
}

export interface Brief {
  objective: string;
  audience: string;
  offer: string;
  brandVoice: string;
}

export interface ReviewInput {
  creative: Creative;
  brief: Brief;
}

export type AgentRole =
  | "coordinator"
  | "strategy"
  | "copy"
  | "compliance"
  | "performance";

export interface AgentFinding {
  agent: AgentRole;
  score: number; // 0-10
  summary: string;
  issues: { text: string; severity: "low" | "medium" | "high"; fix: string }[];
  // Copy agent may return revised copy.
  revisedCopy?: Partial<Creative>;
}

export type Verdict = "GO" | "REVISE" | "KILL";

export interface Scorecard {
  scores: {
    brief_fit: number;
    copy: number;
    compliance: number;
    performance: number;
  };
  overall: number;
  verdict: Verdict;
  topFixes: string[];
  revisedCopy?: Partial<Creative>;
  rationale: string;
}

// One line of the Band room transcript, surfaced to the UI.
export interface TranscriptMessage {
  from: string; // display name, e.g. "Compliance Reviewer"
  role: AgentRole | "system";
  to?: string; // mentioned recipient
  content: string;
  bandMessageId?: string; // real Band message id when in LIVE mode
}

export interface ReviewResult {
  mode: "MOCK" | "LIVE";
  roomId?: string;
  findings: AgentFinding[];
  transcript: TranscriptMessage[];
  scorecard: Scorecard;
}
