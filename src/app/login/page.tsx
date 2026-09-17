"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * T-016: 로그인 UI. 네이버는 Supabase 기본 제공 provider가 아니라 커스텀 OAuth 구현이
 * 필요해(T-015 조사 완료) 여기 포함하지 않는다 — 검증 불가능한 코드를 미리 짜지 않기 위함.
 * 구글/카카오는 Supabase Dashboard에서 provider를 활성화하는 즉시 동작한다(T-013/T-014).
 */
export default function LoginPage() {
  async function signInWith(provider: "google" | "kakao") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <p className="text-sm text-muted">우리의 결혼 준비</p>
        <h1 className="font-display text-2xl">로그인</h1>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => signInWith("google")}
          className="rounded-lg border border-line bg-card px-4 py-2 text-sm"
        >
          Google로 계속하기
        </button>
        <button
          type="button"
          onClick={() => signInWith("kakao")}
          className="rounded-lg border border-line bg-card px-4 py-2 text-sm"
        >
          카카오로 계속하기
        </button>
        <p className="mt-2 text-xs text-muted">네이버 로그인은 준비 중입니다.</p>
      </div>
    </main>
  );
}
