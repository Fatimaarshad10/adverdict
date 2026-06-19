"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import type { ReviewResult } from "@/lib/types";

const EMPTY = {
  creative: {
    headline: "",
    body: "",
    cta: "",
    imageUrl: "",
  },
  brief: {
    objective: "",
    audience: "",
    offer: "",
    brandVoice: "",
  },
};

export default function ReviewPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  const setC = (k: keyof typeof form.creative, v: string) =>
    setForm((f) => ({ ...f, creative: { ...f.creative, [k]: v } }));
  const setB = (k: keyof typeof form.brief, v: string) =>
    setForm((f) => ({ ...f, brief: { ...f.brief, [k]: v } }));

  // Resize an uploaded image and store it as a data URL the vision model can read.
  async function onImageFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await resizeToDataUrl(file, 1024);
      setC("imageUrl", dataUrl);
    } catch {
      setError("Could not read that image. Try a PNG or JPG.");
    } finally {
      setUploading(false);
    }
  }

  function validate(): string | null {
    const c = form.creative;
    const b = form.brief;
    if (!c.headline.trim()) return "Add a headline.";
    if (!c.body.trim()) return "Add body copy.";
    if (!c.cta.trim()) return "Add a call to action.";
    if (!b.objective.trim()) return "Add a campaign objective.";
    if (!b.audience.trim()) return "Add a target audience.";
    if (!b.offer.trim()) return "Add the offer.";
    if (!b.brandVoice.trim()) return "Add the brand voice.";
    return null;
  }

  async function run() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />

      <main className="container section" style={{ paddingTop: 40 }}>
        <div className="section-head" style={{ marginBottom: 28 }}>
          <div className="eyebrow">Live review</div>
          <h2>Run your creative through the agent team</h2>
          <p>Five agents review it together in a Band room and return a verdict with fixes.</p>
        </div>

        <div className="tool-grid">
          {/* Input */}
          <div className="card">
            <h2 className="card-title">Creative</h2>
            <label>Headline</label>
            <input
              value={form.creative.headline}
              onChange={(e) => setC("headline", e.target.value)}
              placeholder="e.g. Lose 10kg in 2 weeks — guaranteed!"
            />
            <label>Body</label>
            <textarea
              value={form.creative.body}
              onChange={(e) => setC("body", e.target.value)}
              placeholder="The main ad copy your audience will read…"
            />
            <label>CTA</label>
            <input
              value={form.creative.cta}
              onChange={(e) => setC("cta", e.target.value)}
              placeholder="e.g. Buy now"
            />

            <label>Ad image (optional — the agents will look at it)</label>
            {form.creative.imageUrl ? (
              <div className="img-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.creative.imageUrl} alt="Ad creative preview" />
                <button type="button" className="img-remove" onClick={() => setC("imageUrl", "")} aria-label="Remove image">
                  ✕
                </button>
              </div>
            ) : (
              <label className="img-drop">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && onImageFile(e.target.files[0])}
                />
                {uploading ? "Reading image…" : "Upload an ad screenshot (PNG / JPG)"}
              </label>
            )}

            <h2 className="card-title" style={{ marginTop: 24 }}>Brief</h2>
            <label>Objective</label>
            <input
              value={form.brief.objective}
              onChange={(e) => setB("objective", e.target.value)}
              placeholder="e.g. Conversions"
            />
            <label>Audience</label>
            <input
              value={form.brief.audience}
              onChange={(e) => setB("audience", e.target.value)}
              placeholder="e.g. Women 30–45, health-conscious, EU"
            />
            <label>Offer</label>
            <input
              value={form.brief.offer}
              onChange={(e) => setB("offer", e.target.value)}
              placeholder="e.g. 20% off first order"
            />
            <label>Brand voice</label>
            <input
              value={form.brief.brandVoice}
              onChange={(e) => setB("brandVoice", e.target.value)}
              placeholder="e.g. Warm, science-backed, no hype"
            />

            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? "Agents reviewing…" : "Run AdVerdict review"}
            </button>
            {error && <div className="error">{error}</div>}
          </div>

          {/* Output */}
          <div className="card">
            <h2 className="card-title">Verdict</h2>
            {!result && !loading && (
              <p className="empty">Run a review to see the agents collaborate and the scorecard appear here.</p>
            )}
            {loading && <p className="empty">The five agents are reviewing your creative in a Band room…</p>}
            {result && (
              <>
                <span className={`verdict-badge verdict-${result.scorecard.verdict}`}>
                  {result.scorecard.verdict}
                  <small>overall {result.scorecard.overall}/10</small>
                </span>

                <div className="scores">
                  <div className="score"><b>{result.scorecard.scores.brief_fit}</b><span>Brief fit</span></div>
                  <div className="score"><b>{result.scorecard.scores.copy}</b><span>Copy</span></div>
                  <div className="score"><b>{result.scorecard.scores.compliance}</b><span>Compliance</span></div>
                  <div className="score"><b>{result.scorecard.scores.performance}</b><span>Performance</span></div>
                </div>

                <div className="subhead">Top fixes</div>
                {result.scorecard.topFixes.length ? (
                  result.scorecard.topFixes.map((f, i) => <div className="fix" key={i}>{f}</div>)
                ) : (
                  <p className="empty">No fixes needed.</p>
                )}

                {result.scorecard.revisedCopy?.headline && (
                  <>
                    <div className="subhead">Revised copy</div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                      {result.scorecard.revisedCopy.headline}
                    </p>
                  </>
                )}

                <div className="subhead">
                  Band room transcript
                  <span className="tag">{result.mode}{result.roomId ? ` · ${result.roomId.slice(0, 8)}` : ""}</span>
                </div>
                {result.transcript.map((m, i) => (
                  <div className={`msg role-${m.role}`} key={i}>
                    <div className="from">
                      {m.from}
                      {m.to && <span className="to"> → {m.to}</span>}
                    </div>
                    <div className="content">{m.content}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// Downscale an image file to a max dimension and return a JPEG data URL.
// Keeps the payload small enough to send to the vision model in one request.
function resizeToDataUrl(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
