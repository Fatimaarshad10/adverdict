import { NextResponse } from "next/server";
import { runReview } from "@/lib/orchestrator";
import type { ReviewInput } from "@/lib/types";
import fs from "fs/promises";
import path from "path";
import { createService } from "@/lib/supabase/service";

const SAMPLE_INPUTS: ReviewInput[] = [
  {
    creative: { 
      headline: "Just Do It — Nike Air Max 90 Now Available", 
      body: "Experience legendary comfort and style. Limited stock.",
      cta: "Shop Now" 
    },
    brief: { objective: "Drive sales", audience: "Athletes 18-35", offer: "$20 off first order", brandVoice: "Motivational" },
  },
  {
    creative: { 
      headline: "Introducing iPhone 15 Pro — Titanium. Stronger. Lighter.",
      body: "Camera so powerful. Processor so advanced. Starting $999.",
      cta: "Learn more" 
    },
    brief: { objective: "Product launch", audience: "Tech enthusiasts 25-50", offer: "Trade-in credit", brandVoice: "Innovative" },
  },
  {
    creative: { 
      headline: "Taste the Feeling — Coca-Cola Summer Festival",
      body: "Refresh your summer with ice-cold Coke and exclusive concerts.",
      cta: "Find Events" 
    },
    brief: { objective: "Brand awareness", audience: "All ages", offer: "Free ticket entry", brandVoice: "Fun & uplifting" },
  },
  {
    creative: { 
      headline: "Your Favorite Music. All In One App — Spotify Premium",
      body: "Ad-free listening, offline downloads, and crystal-clear sound.",
      cta: "Try Free" 
    },
    brief: { objective: "Conversion", audience: "Music lovers 13-45", offer: "1 month free", brandVoice: "Cool & casual" },
  },
  {
    creative: { 
      headline: "Everything You Need — Amazon Prime Day Exclusive",
      body: "50% off thousands of items. Fast, free 2-day shipping.",
      cta: "Shop Deals" 
    },
    brief: { objective: "Drive traffic", audience: "Shoppers 25-55", offer: "Prime membership discount", brandVoice: "Convenient & trustworthy" },
  },
];

export async function POST() {
  // Ensure MOCK mode for predictable outputs.
  process.env.ADVERDICT_MODE = "MOCK";

  const results = [] as any[];
  for (const input of SAMPLE_INPUTS) {
    try {
      const res = await runReview(input);
      results.push({ input, result: res, createdAt: new Date().toISOString() });
    } catch (e: any) {
      results.push({ input, error: e?.message ?? String(e), createdAt: new Date().toISOString() });
    }
  }

  // Try to insert into Supabase 'reviews' table using the service role key.
  try {
    const supabase = createService();
    const inserts = results.map((r) => ({
      input: r.input,
      result: r.result,
      mode: r.result?.mode ?? null,
      verdict: r.result?.scorecard?.verdict ?? null,
      overall: r.result?.scorecard?.overall ?? null,
      room_id: r.result?.roomId ?? null,
      created_at: r.createdAt,
    }));

    const { error } = await supabase.from("reviews").insert(inserts);
    if (error) {
      // fallback: write to disk and return partial success
      const outPath = path.resolve(process.cwd(), "data/seededReviews.json");
      await fs.writeFile(outPath, JSON.stringify(results, null, 2), "utf8");
      return NextResponse.json({ ok: false, error: error.message, savedToFile: true, count: results.length }, { status: 500 });
    }
  } catch (e: any) {
    const outPath = path.resolve(process.cwd(), "data/seededReviews.json");
    await fs.writeFile(outPath, JSON.stringify(results, null, 2), "utf8");
    return NextResponse.json({ ok: false, error: e?.message ?? String(e), savedToFile: true, count: results.length }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: results.length });
}
