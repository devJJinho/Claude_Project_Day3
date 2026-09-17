"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** T-033: 후보 사진 업로드 — Supabase Storage(candidate-photos 버킷)에 올리고 candidates.photo_url을 갱신한다. */
export async function uploadCandidatePhoto(
  workspaceId: string,
  candidateId: string,
  formData: FormData
) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "사진 파일을 선택해 주세요." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${workspaceId}/${candidateId}-${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("candidate-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  // 버킷이 비공개(T-056)라 공개 URL 대신 스토리지 경로만 저장한다 — 실제 표시할 때마다
  // signed URL을 새로 발급한다(만료되는 URL을 DB에 고정 저장하지 않기 위함).
  const { error: updateError } = await supabase
    .from("candidates")
    .update({ photo_url: path })
    .eq("id", candidateId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/workspaces/${workspaceId}`);
  return { error: null };
}
