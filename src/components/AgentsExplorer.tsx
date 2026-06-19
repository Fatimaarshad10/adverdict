"use client";

import { useState } from "react";
import Link from "next/link";

const AGENTS = [
  {
    n: "01",
    ic: "🧭",
    name: "Coordinator",
    role: "coordinator",
    desc: "Opens the Band room, shares the brief, collects every specialist's findings, and issues the final GO / REVISE / KILL verdict.",
  },
  {
    n: "02",
    ic: "🎯",
    name: "Strategy Agent",
    role: "strategy",
    desc: "Checks whether the creative matches the campaign objective, target audience, and offer — and scores the brief fit.",
  },
  {
    n: "03",
    ic: "✍️",
    name: "Copy Agent",
    role: "copy",
    desc: "Scores and rewrites the hook, body, and CTA into stronger, compliant copy when the Compliance Reviewer raises a flag.",
  },
  {
    n: "04",
    ic: "🛡️",
    name: "Compliance Reviewer",
    role: "compliance",
    desc: "Flags risky or unsubstantiated claims, missing disclaimers, and off-brand voice — then re-approves once the copy is fixed.",
  },
  {
    n: "05",
    ic: "📈",
    name: "Performance Predictor",
    role: "performance",
    desc: "Predicts likely performance from hook strength, clarity, relevance, and creative-fatigue risk.",
  },
];

export default function AgentsExplorer() {
  const [active, setActive] = useState(0);
  const agent = AGENTS[active];

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="The five agents">
        {AGENTS.map((a, i) => (
          <button
            key={a.n}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`tab ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="tn">{a.n}</span> {a.name.replace(" Agent", "").replace(" Reviewer", "").replace(" Predictor", "")}
          </button>
        ))}
      </div>

      <div className={`agent-feature role-${agent.role}`} key={agent.role}>
        <div className="agent-feature-ic">{agent.ic}</div>
        <div>
          <div className="agent-feature-name">
            <span className="agent-feature-n">{agent.n}</span> {agent.name}
          </div>
          <p className="agent-feature-desc">{agent.desc}</p>
        </div>
      </div>

      <div className="viewall-wrap">
        <Link href="/review" className="viewall">Run a review →</Link>
      </div>
    </div>
  );
}
