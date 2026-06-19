import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AgentsExplorer from "@/components/AgentsExplorer";
import { createService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type RecentReview = {
  id: string;
  headline: string;
  objective: string;
  audience: string;
  verdict: "GO" | "REVISE" | "KILL";
  overall: number;
  created_at: string;
};

// Real verdicts issued by the agent team, newest first. Falls back to a small
// curated set so the landing page never renders empty during a demo.
async function getRecentReviews(): Promise<{ items: RecentReview[]; live: boolean }> {
  try {
    const supabase = createService();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, input, verdict, overall, created_at")
      .order("created_at", { ascending: false })
      .limit(6);
    if (error || !data?.length) throw error ?? new Error("empty");

    const items: RecentReview[] = data
      .filter((r: any) => r.verdict)
      .map((r: any) => ({
        id: r.id,
        headline: r.input?.creative?.headline ?? "Untitled creative",
        objective: r.input?.brief?.objective ?? "—",
        audience: r.input?.brief?.audience ?? "—",
        verdict: r.verdict,
        overall: r.overall ?? 0,
        created_at: r.created_at,
      }));
    if (!items.length) throw new Error("no verdicts");
    return { items, live: true };
  } catch {
    return { items: FALLBACK_REVIEWS, live: false };
  }
}

const FALLBACK_REVIEWS: RecentReview[] = [
  { id: "s1", headline: "Lose 10kg in 2 weeks — guaranteed!", objective: "Conversions", audience: "Women 30–45, EU", verdict: "REVISE", overall: 4.8, created_at: new Date().toISOString() },
  { id: "s2", headline: "The 5-minute morning routine top founders swear by", objective: "Awareness", audience: "Founders, US", verdict: "GO", overall: 8.2, created_at: new Date().toISOString() },
  { id: "s3", headline: "Cure your anxiety — doctors hate this one trick", objective: "Conversions", audience: "Adults 25–50", verdict: "KILL", overall: 2.6, created_at: new Date().toISOString() },
  { id: "s4", headline: "Your team’s busywork, automated by Friday", objective: "Leads", audience: "Ops managers, B2B", verdict: "GO", overall: 7.6, created_at: new Date().toISOString() },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const PILLARS = [
  { lbl: "The room", h: "One shared workspace", p: "All five agents join a single Band room and work off the same brief — no silos, no copy-paste." },
  { lbl: "The handoffs", h: "Real agent-to-agent work", p: "Agents @mention each other, pass structured findings, and hand off tasks live through Band." },
  { lbl: "The verdict", h: "A decision you can ship", p: "You get GO / REVISE / KILL with scores, fixes, and rewritten copy — ready to act on." },
];

const STATS = [
  { b: "5", s: "Agents in the room" },
  { b: "<60s", s: "Per full review" },
  { b: "4", s: "Review dimensions" },
  { b: "1", s: "Clear verdict" },
];

export default async function Landing() {
  const { items: recent, live } = await getRecentReviews();
  return (
    <>
      <Nav />

      {/* Hero */}
      <header className="container hero">
        <span className="label-pill"><span className="mk">✳</span> Powered by Band · multi-agent review</span>
        <h1>
          Your ad’s <span className="chip chip-accent">verdict</span>, before you spend a cent.
        </h1>
        <p className="lede">
          AdVerdict puts a team of five AI agents in one room. They debate your creative,
          catch compliance risks, rewrite weak copy, and hand back a clear GO / REVISE / KILL
          verdict in under a minute.
        </p>
        <div className="hero-cta">
          <Link href="/review" className="btn btn-primary btn-lg">Run a free review</Link>
          <Link href="/#how" className="btn-circle" aria-label="How it works">↗</Link>
        </div>
        <div className="stat-row">
          {STATS.map((s) => (
            <div className="stat" key={s.s}>
              <b>{s.b}</b>
              <span>{s.s}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Pillars — image-2 "About / ecosystem / community" card row */}
      <section id="how" className="section">
        <div className="container">
          <div className="feature-grid">
            {PILLARS.map((c) => (
              <div className="tile card-hover" key={c.lbl}>
                <div className="card-top">
                  <span className="lbl">{c.lbl}</span>
                  <span className="arrow">↗</span>
                </div>
                <h3 style={{ fontSize: 24, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{c.h}</h3>
                <p style={{ margin: 0, fontSize: 14.5 }}>{c.p}</p>
              </div>
            ))}
          </div>
          <div className="viewall-wrap">
            <Link href="/review" className="viewall">Try it now →</Link>
          </div>
        </div>
      </section>

      {/* Showcase — centered heading + big card + small cards (image-2 "Customised energy") */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head center">
            <span className="label-pill"><span className="mk">how it works</span></span>
            <h2>The agents collaborate, in the open.</h2>
            <p>Watch a real Band room: findings shared, a flag raised, copy rewritten, and a verdict reached.</p>
          </div>
          <div className="showcase">
            <div className="tile">
              <div className="card-top">
                <span className="lbl">Live Band room</span>
                <span className="arrow">↗</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <strong style={{ fontSize: 17 }}>“Lose 10kg in 2 weeks — guaranteed!”</strong>
                <span className="verdict-badge verdict-REVISE" style={{ fontSize: 20, padding: "6px 14px" }}>REVISE <small>4.75</small></span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="ov-chip">Brief fit 2</span>
                <span className="ov-chip">Copy 4</span>
                <span className="ov-chip">Compliance 7</span>
                <span className="ov-chip">Performance 6</span>
              </div>
              <p style={{ color: "var(--muted-light)", fontSize: 13.5, marginTop: 14, marginBottom: 0 }}>
                Compliance flagged the “guaranteed” claim → Copy rewrote it → Compliance approved → verdict issued.
              </p>
            </div>
            <div className="stack">
              <div className="mini c-compliance">Catches risky claims</div>
              <div className="mini c-performance">Predicts performance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents — centered heading + numbered tabs + cards (image-2 "specs") */}
      <section id="agents" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head center">
            <span className="label-pill"><span className="mk">the team</span></span>
            <h2>Five specialists, one room.</h2>
            <p>Each agent owns one job — that’s what makes the review fast, thorough, and trustworthy.</p>
          </div>
          <AgentsExplorer />
        </div>
      </section>

      {/* Live verdicts — real creatives reviewed today */}
      <section id="today" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head center">
            <span className="label-pill">
              <span className={`live-dot ${live ? "" : "muted"}`} />
              {live ? "Reviewed today · live from the room" : "Sample verdicts"}
            </span>
            <h2>Real ads, real verdicts.</h2>
            <p>Every creative the team reviews lands here with its score — see what shipped and what got killed.</p>
          </div>
          <div className="verdict-grid">
            {recent.map((r) => (
              <div className="verdict-card" key={r.id}>
                <div className="verdict-card-head">
                  <span className={`dot-badge dot-${r.verdict}`}>{r.verdict}</span>
                  <span className="vc-time">{timeAgo(r.created_at)}</span>
                </div>
                <p className="vc-headline">“{r.headline}”</p>
                <div className="vc-meta">
                  <span className="vc-tag">{r.objective}</span>
                  <span className="vc-tag">{r.audience}</span>
                </div>
                <div className="vc-foot">
                  <div className="vc-score">
                    <b>{Number(r.overall).toFixed(1)}</b><span>/10 overall</span>
                  </div>
                  <div className={`vc-bar vc-bar-${r.verdict}`}>
                    <span style={{ width: `${Math.min(100, Number(r.overall) * 10)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="viewall-wrap">
            <Link href="/reviews" className="viewall">See all verdicts →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container" style={{ paddingBottom: 84 }}>
        <div className="tile accent" style={{ textAlign: "center", padding: "52px 24px" }}>
          <h2 style={{ fontSize: 32, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Stop guessing. Start shipping ads that work.
          </h2>
          <p style={{ maxWidth: "48ch", margin: "0 auto 24px", fontSize: 16 }}>
            Catch the problems before your audience — and your budget — does.
          </p>
          <Link href="/review" className="btn btn-ghost btn-lg" style={{ borderColor: "#fff", color: "#fff" }}>Run a free review →</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
