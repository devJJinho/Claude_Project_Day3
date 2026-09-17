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

  const {
    data: { publicUrl },
  } = supabase.storage.from("candidate-photos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ photo_url: publicUrl })
    .eq("id", candidateId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/workspaces/${workspaceId}`);
  return { error: null };
}
