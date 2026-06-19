// Server-side Supabase service client using the service role key.
import { createClient as createServiceClient } from "@supabase/supabase-js";

export function createService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE URL or SUPABASE_SECRET_KEY in environment");
  return createServiceClient(url, key, { auth: { persistSession: false } });
}
