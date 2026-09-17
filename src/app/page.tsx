import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { DashboardView, type WorkspaceSummary } from "./dashboard/DashboardView";

export default async function Home() {
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted">우리의 결혼 준비</p>
        <h1 className="text-3xl font-bold">결혼 준비 사이트</h1>
        {user ? (
          <>
            <p className="max-w-md text-sm text-muted">아직 연결된 공간이 없습니다.</p>
            <Link href="/invite" className="rounded-lg bg-accent px-4 py-2 text-sm text-white">
              시작하기
            </Link>
          </>
        ) : (
          <>
            <p className="max-w-md text-sm text-muted">로그인이 필요합니다.</p>
            <Link href="/login" className="rounded-lg bg-accent px-4 py-2 text-sm text-white">
              로그인
            </Link>
          </>
        )}
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
