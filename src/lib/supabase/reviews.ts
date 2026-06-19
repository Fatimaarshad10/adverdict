// Persist a completed review to the `reviews` table.
// Uses the service-role client (server-only) so the insert isn't blocked by RLS.
import { createService } from "./service";
import type { ReviewInput, ReviewResult } from "@/lib/types";

export interface SavedReview {
  id: string;
}

// Insert one review. Throws on DB error so the caller can decide whether to surface it.
export async function saveReview(
  input: ReviewInput,
  result: ReviewResult
): Promise<SavedReview> {
  const supabase = createService();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      input,
      result,
      mode: result.mode,
      verdict: result.scorecard.verdict,
      overall: result.scorecard.overall,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data as SavedReview;
}
