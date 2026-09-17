import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { DashboardView, type WorkspaceSummary } from "./dashboard/DashboardView";

export default async function Home() {
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted">우리의 결혼 준비</p>
        <h1 className="text-3xl font-bold">결혼 준비 사이트</h1>
        <p className="max-w-md text-sm text-muted">로그인 후 커플 연결이 필요합니다.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, title, category, candidates(status, created_at)")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-2xl">대시보드</h1>
      <DashboardView workspaces={(workspaces ?? []) as WorkspaceSummary[]} />
    </main>
  );
}
