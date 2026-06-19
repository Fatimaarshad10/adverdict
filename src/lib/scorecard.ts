// Builds the final scorecard + verdict from all agent findings.
import type { AgentFinding, Scorecard, Verdict, Creative } from "./types";

export function buildScorecard(
  findings: AgentFinding[],
  revisedCopy?: Partial<Creative>
): Scorecard {
  const by = (role: string) => findings.find((f) => f.agent === role);

  const scores = {
    brief_fit: by("strategy")?.score ?? 0,
    copy: by("copy")?.score ?? 0,
    compliance: by("compliance")?.score ?? 0,
    performance: by("performance")?.score ?? 0,
  };

  const overall =
    Math.round(
      ((scores.brief_fit + scores.copy + scores.compliance + scores.performance) /
        4) *
        100
    ) / 100;

  const allIssues = findings.flatMap((f) =>
    f.issues.map((i) => ({ ...i, agent: f.agent }))
  );
  const highCompliance = (by("compliance")?.issues || []).some(
    (i) => i.severity === "high"
  );

  // Transparent, explainable verdict logic.
  let verdict: Verdict;
  if (overall < 4 || (highCompliance && scores.compliance <= 2)) {
    verdict = "KILL";
  } else if (overall >= 7 && !highCompliance) {
    verdict = "GO";
  } else {
    verdict = "REVISE";
  }

  const topFixes = allIssues
    .sort((a, b) => sev(b.severity) - sev(a.severity))
    .slice(0, 4)
    .map((i) => `${i.fix} (${i.agent}, ${i.severity})`);

  const rationale =
    `Overall ${overall}/10 across brief-fit ${scores.brief_fit}, copy ${scores.copy}, ` +
    `compliance ${scores.compliance}, performance ${scores.performance}. ` +
    (highCompliance
      ? "A high-severity compliance issue was raised. "
      : "No high-severity compliance issues. ") +
    `Verdict: ${verdict}.`;

  return { scores, overall, verdict, topFixes, revisedCopy, rationale };
}

function sev(s: string): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}
