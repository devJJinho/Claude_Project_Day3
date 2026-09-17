import { createClient } from "@/lib/supabase/server";

/**
 * 로그인한 사용자가 속한 couple_id를 조회한다(현재는 사용자당 커플 1개 가정).
 * 로그인 전(T-013~016 완료 전)이거나 아직 커플에 연결되지 않은 상태면 null을 반환한다 —
 * 호출하는 화면은 이 경우를 "로그인/연결 필요" 상태로 처리해야 한다.
 */
export async function getCurrentCoupleId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("profile_id", user.id)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  return data?.couple_id ?? null;
}
