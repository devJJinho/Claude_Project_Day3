"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";

export type CandidateStatus = "candidate" | "pending" | "rejected" | "confirmed";

/** T-025: 워크플레이스(항목) 생성. */
export async function createWorkspace(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!title || !category) return { error: "제목과 카테고리를 입력해 주세요." };

  const coupleId = await getCurrentCoupleId();
  if (!coupleId) return { error: "로그인 후 커플 연결이 필요합니다." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("workspaces")
    .insert({ couple_id: coupleId, title, category, created_by: user?.id });
  if (error) return { error: error.message };

  revalidatePath("/workspaces");
  return { error: null };
}

/** T-027/T-028: 후보 등록(전 필드 선택 입력). */
export async function addCandidate(workspaceId: string, formData: FormData) {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) return { error: "로그인 후 커플 연결이 필요합니다." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const optionalText = (key: string) => {
    const v = formData.get(key);
    return v && String(v).trim() !== "" ? String(v).trim() : null;
  };
  const optionalNumber = (key: string) => {
    const v = optionalText(key);
    return v === null ? null : Number(v);
  };

  const { error } = await supabase.from("candidates").insert({
    workspace_id: workspaceId,
    created_by: user?.id,
    name: optionalText("name"),
    link: optionalText("link"),
    location: optionalText("location"),
    comment: optionalText("comment"),
    price_range: optionalText("price_range"),
    reservation_status: optionalText("reservation_status"),
    reservation_date: optionalText("reservation_date"),
    rating: optionalNumber("rating"),
  });
  if (error) return { error: error.message };

  revalidatePath(`/workspaces/${workspaceId}`);
  return { error: null };
}

/** T-030: 후보 상태 변경(후보/보류/탈락/확정 — 항목당 확정 개수 제한 없음). */
export async function updateCandidateStatus(
  workspaceId: string,
  candidateId: string,
  status: CandidateStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", candidateId);
  if (error) return { error: error.message };

  revalidatePath(`/workspaces/${workspaceId}`);
  return { error: null };
}
