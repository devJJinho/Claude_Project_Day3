import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

/**
 * T-023: 참여자 탈퇴 — 본인 계정(auth.users)만 삭제하고, 등록한 후보/코멘트는 남긴다
 * (candidates.created_by는 on delete set null이라 자동으로 유지됨).
 * auth.users 삭제는 클라이언트 SDK로 못 하고 Admin API(service_role)가 필요하다 — 그래서
 * 이 라우트가 서버에서만 실행된다. 반드시 먼저 "이 요청을 보낸 사람이 실제 그 계정의
 * 주인인지" 본인 세션으로 확인한 뒤, 그 세션의 user id만 삭제 대상으로 쓴다(다른 사람의
 * id를 body로 받아 삭제하는 방식은 절대 쓰지 않는다).
 */
export async function DELETE() {
  const sessionClient = await createServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "서버 설정 오류(service role key 없음)." }, { status: 500 });
  }

  const adminClient = createSupabaseJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sessionClient.auth.signOut();
  return NextResponse.json({ ok: true });
}
