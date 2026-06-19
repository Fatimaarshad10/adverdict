"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (!email) {
    return (
      <Link href="/login" className="btn btn-primary" style={{ padding: "9px 18px" }}>
        Sign in
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        title={email}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: "var(--accent-grad)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {email[0].toUpperCase()}
      </span>
      <form action="/auth/signout" method="post">
        <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 14 }}>
          Sign out
        </button>
      </form>
    </div>
  );
}
