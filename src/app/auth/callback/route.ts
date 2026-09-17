import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** T-016: OAuth 로그인 완료 후 콜백 — code를 세션으로 교환하고 대시보드로 이동. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
