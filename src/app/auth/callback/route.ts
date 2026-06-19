// OAuth / email-confirmation callback: exchanges the code for a session cookie.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/review";

  if (code) {
    const supabase = await createClient();
    // exchangeCodeForSession takes the auth code, not the full URL.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(error.message)}`
    );
  }

  // No code in the URL — provider may have returned an error instead.
  const providerError = searchParams.get("error_description") || searchParams.get("error");
  if (providerError) {
    console.error("[auth/callback] provider error:", providerError);
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(providerError)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth&reason=no_code`);
}
