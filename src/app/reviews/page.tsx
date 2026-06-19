"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type ReviewRecord = {
  id: string;
  input: {
    creative: { headline: string; body: string; cta: string };
    brief: { objective: string; audience?: string };
  };
  result: any;
  mode: string | null;
  verdict: "GO" | "REVISE" | "KILL" | string | null;
  overall: number | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load reviews");
        setReviews(data.reviews || []);
      } catch (e: any) {
        setError(e.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = reviews.reduce(
    (acc, r) => {
      if (r.verdict === "GO") acc.go++;
      else if (r.verdict === "REVISE") acc.revise++;
      else if (r.verdict === "KILL") acc.kill++;
      return acc;
    },
    { go: 0, revise: 0, kill: 0 }
  );

  return (
    <>
      <Nav />

      <main className="container section" style={{ paddingTop: 40 }}>
        <div
          className="section-head"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}
        >
          <div>
            <div className="eyebrow">The verdict log</div>
            <h2>Every creative the team reviewed</h2>
            <p>Real verdicts issued by the five-agent Band room — newest first.</p>
          </div>
          <form action="/api/seed" method="post">
            <button className="btn btn-ghost">Generate seed data</button>
          </form>
        </div>

        {!loading && !error && reviews.length > 0 && (
          <div className="stat-row" style={{ marginTop: 0, marginBottom: 30, paddingTop: 0, borderTop: "none", justifyContent: "flex-start", gap: 40 }}>
            <div className="stat"><b>{reviews.length}</b><span>Total reviews</span></div>
            <div className="stat"><b style={{ color: "var(--go)" }}>{counts.go}</b><span>GO</span></div>
            <div className="stat"><b style={{ color: "var(--revise)" }}>{counts.revise}</b><span>REVISE</span></div>
            <div className="stat"><b style={{ color: "var(--kill)" }}>{counts.kill}</b><span>KILL</span></div>
          </div>
        )}

        {loading ? (
          <p className="empty">Loading verdicts…</p>
        ) : error ? (
          <div className="error">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <p className="empty" style={{ marginBottom: 16 }}>No reviews yet.</p>
            <form action="/api/seed" method="post">
              <button className="btn btn-primary">Generate seed data</button>
            </form>
          </div>
        ) : (
          <div className="verdict-grid">
            {reviews.map((r) => (
              <div className="verdict-card" key={r.id}>
                <div className="verdict-card-head">
                  <span className={`dot-badge dot-${r.verdict ?? "REVISE"}`}>{r.verdict ?? "ERR"}</span>
                  <span className="vc-time">{timeAgo(r.created_at)}</span>
                </div>
                <p className="vc-headline">“{r.input?.creative?.headline ?? "Untitled creative"}”</p>
                <div className="vc-meta">
                  <span className="vc-tag">{r.input?.brief?.objective ?? "—"}</span>
                  {r.input?.brief?.audience && <span className="vc-tag">{r.input.brief.audience}</span>}
                  {r.mode && <span className="vc-tag">{r.mode}</span>}
                </div>
                <div className="vc-foot">
                  <div className="vc-score">
                    <b>{r.overall != null ? Number(r.overall).toFixed(1) : "—"}</b><span>/10 overall</span>
                  </div>
                  <div className={`vc-bar vc-bar-${r.verdict ?? "REVISE"}`}>
                    <span style={{ width: `${Math.min(100, (Number(r.overall) || 0) * 10)}%` }} />
                  </div>
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ fontSize: 12.5, color: "var(--muted)", cursor: "pointer" }}>Raw result</summary>
                    <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 11.5, color: "var(--muted-light)", maxHeight: 220, overflow: "auto" }}>
                      {JSON.stringify(r.result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="viewall-wrap">
          <Link href="/review" className="viewall">Run a new review →</Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
