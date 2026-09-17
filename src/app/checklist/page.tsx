import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { AddChecklistForm } from "./add-checklist-form";
import { ChecklistList, type ChecklistItem } from "./checklist-list";

export default async function ChecklistPage() {
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">체크리스트</h1>
        <p className="max-w-md text-sm text-muted">로그인이 필요합니다.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("checklist_items")
    .select("id, title, is_done")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: true });

  const items: ChecklistItem[] = data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">체크리스트</h1>
      <AddChecklistForm />
      <ChecklistList items={items} />
    </main>
  );
}
