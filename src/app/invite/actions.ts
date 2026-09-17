"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** T-017/T-018: 로그인 후 첫 사용자가 자신의 커플(공간)을 만든다. */
export async function createMyCouple() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_my_couple");
  if (error) return { error: error.message };
  revalidatePath("/invite");
  revalidatePath("/");
  return { error: null };
}

/** T-019: 초대 코드로 기존 커플에 참여 요청(status=invited, 승인 대기). */
export async function joinCoupleByCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "초대 코드를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_couple_by_invite_code", { p_code: code });
  if (error) return { error: error.message };
  revalidatePath("/invite");
  return { error: null };
}

/** T-018: 내 커플의 초대 코드 발급/조회(없으면 새로 만듦). */
export async function getOrCreateInviteCode(coupleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_invite_code", { p_couple_id: coupleId });
  if (error) return { code: null, error: error.message };
  return { code: data as string, error: null };
}

/** T-020/T-021: 대기 중인 참여 요청 승인. */
export async function approveMember(coupleId: string, profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_couple_member", {
    p_couple_id: coupleId,
    p_profile_id: profileId,
  });
  if (error) return { error: error.message };
  revalidatePath("/invite");
  return { error: null };
}

/** T-021: 대기 중인 요청 거절. T-023: 기존 멤버가 스스로 나가기(탈퇴)에도 재사용. */
export async function rejectOrLeaveMember(coupleId: string, profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_or_reject_couple_member", {
    p_couple_id: coupleId,
    p_profile_id: profileId,
  });
  if (error) return { error: error.message };
  revalidatePath("/invite");
  return { error: null };
}
