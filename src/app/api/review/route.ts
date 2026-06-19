import { NextResponse } from "next/server";
import { runReview } from "@/lib/orchestrator";
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
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Review failed" },
      { status: 500 }
    );
  }
}
