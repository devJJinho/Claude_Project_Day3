import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { BudgetBoard } from "./budget-board";
import type { BudgetItem } from "./types";

// T-048: 예산 UI(합계 및 카테고리별 표시).
// 로그인/커플 연결 전(현재 항상 이 상태 — 로그인 UI 미구현)에는 안내만 보여준다.
export default async function BudgetPage() {
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted">예산 관리</p>
        <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
        <p className="max-w-md text-sm text-muted">
          커플로 연결된 계정으로 로그인하면 예산 항목을 확인하고 관리할 수 있습니다.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: true });

  const items: BudgetItem[] = error || !data ? [] : data;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted">예산 관리</p>
        <h1 className="text-3xl font-bold">우리의 결혼 준비 예산</h1>
      </header>
      <BudgetBoard initialItems={items} />
    </main>
  );
}
