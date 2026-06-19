# AdVerdict 🎯

**A multi-agent ad-creative review pipeline, built on [Band](https://band.ai).**
Team **Nexora AI** · Band of Agents Hackathon · Track 1: Internal Enterprise Workflows

Five specialized AI agents review a new ad creative **together — through a Band room** — and return a scored **GO / REVISE / KILL** verdict before any ad spend goes out. The standout moment is a real agent-to-agent **flag → revise loop**: the Compliance Reviewer flags a risky claim, the Copy Agent rewrites it, and the Compliance Reviewer re-approves.

---

## The agents

| Agent | Role |
|---|---|
| **Coordinator** | Opens the Band room, shares the creative + brief, assembles the scorecard, posts the verdict |
| **Strategy** | Scores brief / audience / offer fit |
| **Copy** | Scores and rewrites hook, body, CTA |
| **Compliance** | Flags risky/unsubstantiated claims and missing disclaimers |
| **Performance** | Predicts likely performance (hook strength, clarity, fatigue risk) |

Band is the collaboration layer: every agent posts real messages into a shared room with `@mention` handoffs, and the room holds the shared context and task state.

---

## Quick start (MOCK mode — zero setup)

You can run the whole flow immediately without any keys. MOCK mode simulates the
agents with heuristics so you can see the UI, the transcript, and the verdict.

```bash
npm install
cp .env.example .env.local   # default ADVERDICT_MODE=MOCK
npm run dev
```

Open http://localhost:3000, click **Run AdVerdict review**, and watch the agents work.

---

## LIVE mode — real Band + real LLM

1. **Create 5 agents in Band.** Go to https://app.band.ai/agents → **New Agent** →
   **External Agent**, once each for: Coordinator, Strategy, Copy, Compliance, Performance.
   Copy each agent's **API key** (shown once at creation).
2. **Get a free LLM key.** [Groq](https://console.groq.com/keys) is free and OpenAI-compatible
   (default), or use OpenAI.
3. **Fill `.env.local`:**

   ```bash
   ADVERDICT_MODE=LIVE
   LLM_BASE_URL=https://api.groq.com/openai/v1
   LLM_API_KEY=gsk_...
   LLM_MODEL=llama-3.3-70b-versatile
   BAND_COORDINATOR_KEY=...
   BAND_STRATEGY_KEY=...
   BAND_COPY_KEY=...
   BAND_COMPLIANCE_KEY=...
   BAND_PERFORMANCE_KEY=...
   ```

4. `npm run dev`, run a review, then open the room in Band to see the full
   agent-to-agent conversation. The transcript in the UI shows the real Band
   message IDs.

> **Why REST, not the SDK?** Band's real-time SDK is Python-only. This is an
> all-TypeScript Next.js app, so it uses Band's documented Agent REST API
> ("custom integration") — an orchestrator drives the flow and each agent posts
> with its own API key. The collaboration still genuinely happens in Band.

---

## How it works

```
Marketer → Coordinator (opens Band room, recruits 4 specialists)
         → Strategy / Copy / Compliance / Performance each post findings
         → Compliance flags claim → Copy rewrites → Compliance re-approves   (loop, in Band)
         → Coordinator assembles scorecard → GO / REVISE / KILL → human
```

Verdict logic is transparent (see `src/lib/scorecard.ts`):
- **GO** — overall ≥ 7 and no high-severity compliance flag
- **REVISE** — middle ground, or a fixable compliance flag
- **KILL** — overall < 4, or an unresolved high-severity violation

---

## Project structure

```
src/
  app/
    page.tsx            UI: creative + brief form, verdict, scorecard, transcript
    api/review/route.ts POST endpoint that runs the orchestrator
  lib/
    band.ts             Band Agent REST client
    llm.ts              OpenAI-compatible LLM client
    agents.ts           agent roles, prompts, per-agent reasoning
    orchestrator.ts     the AdVerdict flow (LIVE via Band + MOCK)
    scorecard.ts        scoring + GO/REVISE/KILL logic
    types.ts            shared types
```

## Deploy

Deploy to [Vercel](https://vercel.com): import the repo, add the same env vars,
and you get a public demo URL for the hackathon submission.

## License

MIT — see [LICENSE](./LICENSE).
