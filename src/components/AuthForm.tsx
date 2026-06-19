"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nextPath = () => {
    if (typeof window === "undefined") return "/review";
    return new URLSearchParams(window.location.search).get("next") || "/review";
  };

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp(
          { email, password },
          { redirectTo: `${window.location.origin}/auth/callback` }
        );
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath());
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto", padding: 30 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 24, letterSpacing: "-0.02em" }}>
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h2>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        {mode === "signup"
          ? "Start reviewing your ads with the agent team."
          : "Sign in to run reviews and see your history."}
      </p>

      <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={handleGoogle}>
        <GoogleIcon /> Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--border-soft)" }} />
        <span style={{ color: "var(--muted)", fontSize: 12 }}>or</span>
        <span style={{ flex: 1, height: 1, background: "var(--border-soft)" }} />
      </div>

      <form onSubmit={handleEmail}>
        <label>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        <label>Password</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} disabled={loading}>
          {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {notice && (
        <div style={{ background: "var(--go-soft)", color: "var(--go)", fontSize: 13, padding: "11px 13px", borderRadius: "var(--radius-sm)", marginTop: 12 }}>
          {notice}
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Sign in</Link></>
        ) : (
          <>New here? <Link href="/signup" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Create an account</Link></>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
