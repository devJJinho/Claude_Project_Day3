import { clampPercent, formatWon } from "./format";

type BudgetSummaryProps = {
  totalPlanned: number;
  totalActual: number;
};

// 사이드바 미니카드와 같은 시각 언어(accent 색 진행바)를 페이지 상단에 더 크게 재현한다.
export function BudgetSummary({ totalPlanned, totalActual }: BudgetSummaryProps) {
  const percent = clampPercent(totalActual, totalPlanned);
  const isOverBudget = totalPlanned > 0 && totalActual > totalPlanned;

  return (
    <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">전체 예산</h2>
        <p className="text-sm text-muted">
          {formatWon(totalActual)} / {formatWon(totalPlanned)}
        </p>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-muted">
        {isOverBudget ? "예산을 초과했습니다." : `${percent.toFixed(0)}% 사용`}
      </p>
    </section>
  );
}
