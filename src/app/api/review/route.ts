import { NextResponse } from "next/server";
import { runReview } from "@/lib/orchestrator";
import { saveReview } from "@/lib/supabase/reviews";
import type { ReviewInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReviewInput;
    if (!body?.creative?.headline) {
      return NextResponse.json(
        { error: "Missing creative.headline" },
        { status: 400 }
      );
    }
    const result = await runReview(body);

    // Persist the review. Don't fail the request if the save errors — the user
    // should still get their verdict even if the DB is unavailable.
    let savedId: string | null = null;
    try {
      const saved = await saveReview(body, result);
      savedId = saved.id;
    } catch (e: any) {
      console.error("Failed to save review to Supabase:", e?.message ?? e);
    }

    return NextResponse.json({ ...result, savedId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Review failed" },
      { status: 500 }
    );
  }
}
