import { NextResponse } from "next/server";
import { createService } from "@/lib/supabase/service";

// Always read fresh from the database — never serve a cached/stale snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createService();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, input, result, mode, verdict, overall, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, reviews: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? String(e) },
      { status: 500 }
    );
  }
}
