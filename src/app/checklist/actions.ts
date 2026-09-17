"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";

/**
 * 체크리스트 항목 추가. 로그인/커플 연결 전이면(getCurrentCoupleId가 null) 조용히 무시한다 —
 * 이 시점엔 UI가 이미 "로그인이 필요합니다" 상태를 보여주고 있어 폼 자체가 노출되지 않는다.
 * couple_id/created_by는 클라이언트 입력을 신뢰하지 않고 서버에서 직접 조회해 채운다.
 */
export async function addChecklistItem(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const coupleId = await getCurrentCoupleId();
  if (!coupleId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("checklist_items").insert({
    couple_id: coupleId,
    title,
    created_by: user.id,
  });

  revalidatePath("/checklist");
}

/**
 * 체크리스트 항목의 완료 여부를 토글한다. couple_id를 조건에 명시해 RLS와 별개로도
 * 다른 커플의 항목을 건드릴 수 없게 한다(방어적 이중 확인).
 */
export async function toggleChecklistItem(id: string, isDone: boolean) {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) return;

  const supabase = await createClient();
  await supabase
    .from("checklist_items")
    .update({ is_done: isDone })
    .eq("id", id)
    .eq("couple_id", coupleId);

  revalidatePath("/checklist");
}
