// The AdVerdict flow. In LIVE mode the 5 agents collaborate through a real Band
// room (each posts messages with @mention handoffs). In MOCK mode the same flow
// runs locally with heuristic findings so the app is runnable with zero setup.
import type {
  ReviewInput,
  ReviewResult,
  AgentFinding,
  TranscriptMessage,
  AgentRole,
} from "./types";
import { AGENTS, runSpecialist, runCopyRevision } from "./agents";
import { buildScorecard } from "./scorecard";
import * as band from "./band";

export async function runReview(input: ReviewInput): Promise<ReviewResult> {
  const mode = process.env.ADVERDICT_MODE === "LIVE" ? "LIVE" : "MOCK";
  return mode === "LIVE" ? runLive(input) : runMock(input);
}

// --------------------------------------------------------------------------
// LIVE: real Band room + real LLM
// --------------------------------------------------------------------------
async function runLive(input: ReviewInput): Promise<ReviewResult> {
  const keyOf = (role: AgentRole) => {
    const k = process.env[AGENTS[role].envKey];
    if (!k) throw new Error(`Missing ${AGENTS[role].envKey} for ${role} agent.`);
    return k;
  };

  // 1. Resolve every agent's Band identity (id/handle/name) for @mentions.
  //    Validate ALL keys up front and report every bad one at once.
  const ids: Record<AgentRole, band.BandIdentity> = {} as any;
  const badKeys: string[] = [];
  for (const role of Object.keys(AGENTS) as AgentRole[]) {
    const key = keyOf(role);
    try {
      ids[role] = await band.getIdentity(key);
    } catch (e: any) {
      const tail = key.slice(-6);
      badKeys.push(`${role} (${AGENTS[role].envKey}, ends "...${tail}")`);
    }
  }
  if (badKeys.length) {
    throw new Error(
      `Band rejected ${badKeys.length} key(s): ${badKeys.join("; ")}. ` +
        `Re-copy these from Band (Agents → open agent → regenerate API key if needed) into .env.local, then restart 'npm run dev'.`
    );
  }
  const mention = (role: AgentRole) => ({
    id: ids[role].id,
    handle: ids[role].handle,
    name: ids[role].name,
  });

  const transcript: TranscriptMessage[] = [];
  const specialists: Exclude<AgentRole, "coordinator">[] = [
    "strategy",
    "copy",
    "compliance",
    "performance",
  ];

  // 2. Coordinator opens the room and recruits the specialists.
  const roomId = await band.createRoom(keyOf("coordinator"), "AdVerdict — Creative Review");
  for (const role of specialists) {
    await band.addParticipant(keyOf("coordinator"), roomId, ids[role].id);
  }

  // 3. Coordinator shares the creative + brief with the team.
  const briefMsg =
    `Team, please review this creative.\n` +
    `Headline: "${input.creative.headline}" | CTA: "${input.creative.cta}"\n` +
    `Objective: ${input.brief.objective} | Audience: ${input.brief.audience}`;
  const bid = await band.sendMessage(
    keyOf("coordinator"),
    roomId,
    `${specialists.map((r) => "@" + ids[r].name).join(" ")} ${briefMsg}`,
    specialists.map(mention)
  );
  transcript.push({
    from: AGENTS.coordinator.name,
    role: "coordinator",
    content: briefMsg,
    bandMessageId: bid,
  });

  // 4. Each specialist reviews and reports back to the Coordinator.
  const findings: AgentFinding[] = [];
  for (const role of specialists) {
    const finding = await runSpecialist(role, input);
    findings.push(finding);
    const content = `[${role}] score ${finding.score}/10 — ${finding.summary}`;
    const mid = await band.sendMessage(keyOf(role), roomId, `@${ids.coordinator.name} ${content}`, [
      mention("coordinator"),
    ]);
    transcript.push({
      from: AGENTS[role].name,
      role,
      to: AGENTS.coordinator.name,
      content,
      bandMessageId: mid,
    });
  }

  // 5. The flag -> revise loop: Compliance hands issues to Copy, Copy rewrites,
  //    Compliance re-approves. This is the visible agent-to-agent collaboration.
  const compliance = findings.find((f) => f.agent === "compliance")!;
  let revisedCopy;
  const actionable = compliance.issues.filter((i) => i.severity !== "low");
  if (actionable.length) {
    const flag = `@${ids.copy.name} Please fix: ${actionable.map((i) => i.text).join("; ")}`;
    const fmid = await band.sendMessage(keyOf("compliance"), roomId, flag, [mention("copy")]);
    transcript.push({ from: AGENTS.compliance.name, role: "compliance", to: AGENTS.copy.name, content: flag, bandMessageId: fmid });

    const revision = await runCopyRevision(input, actionable);
    revisedCopy = revision.revisedCopy;
    const revMsg = `@${ids.compliance.name} Revised: "${revisedCopy.headline}" / CTA "${revisedCopy.cta}". ${revision.note}`;
    const rmid = await band.sendMessage(keyOf("copy"), roomId, revMsg, [mention("compliance")]);
    transcript.push({ from: AGENTS.copy.name, role: "copy", to: AGENTS.compliance.name, content: revMsg, bandMessageId: rmid });

    const okMsg = `@${ids.coordinator.name} Revisions resolve the flagged issues. Approved.`;
    const omid = await band.sendMessage(keyOf("compliance"), roomId, okMsg, [mention("coordinator")]);
    transcript.push({ from: AGENTS.compliance.name, role: "compliance", to: AGENTS.coordinator.name, content: okMsg, bandMessageId: omid });
    // Reflect the resolution in the compliance score.
    compliance.score = Math.max(compliance.score, 7);
  }

  // 6. Coordinator assembles the scorecard and posts the verdict.
  const scorecard = buildScorecard(findings, revisedCopy);
  const verdictMsg = `Verdict: ${scorecard.verdict} (overall ${scorecard.overall}/10). ${scorecard.rationale}`;
  const vmid = await band.sendMessage(
    keyOf("coordinator"),
    roomId,
    `${specialists.map((r) => "@" + ids[r].name).join(" ")} ${verdictMsg}`,
    specialists.map(mention)
  );
  transcript.push({ from: AGENTS.coordinator.name, role: "coordinator", content: verdictMsg, bandMessageId: vmid });

  return { mode: "LIVE", roomId, findings, transcript, scorecard };
}

// --------------------------------------------------------------------------
// MOCK: same flow, heuristic findings, no external calls
// --------------------------------------------------------------------------
async function runMock(input: ReviewInput): Promise<ReviewResult> {
  const text = `${input.creative.headline} ${input.creative.body} ${input.creative.cta}`.toLowerCase();
  const riskyTerms = ["guaranteed", "guarantee", "cure", "clinically proven", "miracle", "100%", "instant"];
  // De-duplicate overlapping matches (e.g. "guaranteed" already covers "guarantee").
  const hits: string[] = [];
  for (const t of riskyTerms) {
    if (text.includes(t) && !hits.some((h) => h.includes(t) || t.includes(h))) {
      hits.push(t);
    }
  }

  const findings: AgentFinding[] = [
    {
      agent: "strategy",
      score: 7,
      summary: "Mostly aligned with the objective and audience; offer could be clearer in the hook.",
      issues: [{ text: "Offer not stated in headline", severity: "low", fix: "Surface the discount in the hook" }],
    },
    {
      agent: "copy",
      score: 6,
      summary: "Hook is generic; CTA is functional but flat.",
      issues: [{ text: "Weak, product-first hook", severity: "medium", fix: "Lead with the benefit, not the product" }],
    },
    {
      agent: "compliance",
      score: hits.length ? 3 : 8,
      summary: hits.length
        ? `Found ${hits.length} risky claim(s): ${hits.join(", ")}.`
        : "No major compliance issues detected.",
      issues: hits.map((h) => ({
        text: `Unsubstantiated claim: "${h}"`,
        severity: "high" as const,
        fix: `Remove or soften "${h}" (e.g. "may support")`,
      })),
    },
    {
      agent: "performance",
      score: 5,
      summary: "Average predicted performance; hook strength limits scroll-stop potential.",
      issues: [{ text: "Low hook strength", severity: "medium", fix: "Test a curiosity or outcome-led hook" }],
    },
  ];

  const hasImage = !!input.creative.imageUrl;
  const transcript: TranscriptMessage[] = [
    {
      from: "Coordinator",
      role: "coordinator",
      content: `Team, review: "${input.creative.headline}"${hasImage ? " (ad image attached)" : ""}`,
    },
    ...findings.map<TranscriptMessage>((f) => ({
      from: AGENTS[f.agent].name,
      role: f.agent,
      to: "Coordinator",
      content: `[${f.agent}] score ${f.score}/10 — ${f.summary}`,
    })),
  ];

  let revisedCopy;
  const actionable = findings.find((f) => f.agent === "compliance")!.issues.filter((i) => i.severity !== "low");
  if (actionable.length) {
    transcript.push({ from: "Compliance Reviewer", role: "compliance", to: "Copy Agent", content: `@Copy Agent Please fix: ${actionable.map((i) => i.text).join("; ")}` });
    const cleaned = input.creative.headline
      .replace(/clinically proven|guaranteed|guarantee|cure|miracle|100%|instant/gi, "")
      .replace(/\s*[—–-]\s*(?=$|[!?.,])/g, " ") // drop dangling dashes
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([!?.,])/g, "$1")
      .replace(/[\s—–-]+$/g, "")
      .trim();
    revisedCopy = {
      headline: cleaned.length > 8 ? cleaned : "Feel lighter in weeks — backed by science",
      body: input.creative.body,
      cta: input.creative.cta,
    };
    transcript.push({ from: "Copy Agent", role: "copy", to: "Compliance Reviewer", content: `@Compliance Reviewer Revised headline: "${revisedCopy.headline}"` });
    transcript.push({ from: "Compliance Reviewer", role: "compliance", to: "Coordinator", content: "@Coordinator Revisions resolve the flagged issues. Approved." });
    findings.find((f) => f.agent === "compliance")!.score = 7;
  }

  const scorecard = buildScorecard(findings, revisedCopy);
  transcript.push({ from: "Coordinator", role: "coordinator", content: `Verdict: ${scorecard.verdict} (overall ${scorecard.overall}/10).` });

  return { mode: "MOCK", findings, transcript, scorecard };
}
