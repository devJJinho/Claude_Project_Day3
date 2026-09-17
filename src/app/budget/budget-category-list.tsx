import type { BudgetItem } from "./types";
import { BudgetItemRow } from "./budget-item-row";
import { clampPercent, formatWon } from "./format";

type BudgetCategoryListProps = {
  items: BudgetItem[];
  onSave: (
    id: string,
    updates: { category?: string; planned_amount?: number; actual_amount?: number }
  ) => Promise<string | null>;
};

type CategoryGroup = {
  category: string;
  items: BudgetItem[];
  planned: number;
  actual: number;
};

function groupByCategory(items: BudgetItem[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const item of items) {
    const existing = groups.get(item.category);
    if (existing) {
      existing.items.push(item);
      existing.planned += item.planned_amount;
      existing.actual += item.actual_amount;
    } else {
      groups.set(item.category, {
        category: item.category,
        items: [item],
        planned: item.planned_amount,
        actual: item.actual_amount,
      });
    }
  }
  return Array.from(groups.values());
}

export function BudgetCategoryList({ items, onSave }: BudgetCategoryListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
        아직 등록된 예산 항목이 없습니다. 아래에서 첫 항목을 추가해 보세요.
      </p>
    );
  }

  const groups = groupByCategory(items);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.category} className="rounded-2xl border border-line bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-base font-bold">{group.category}</h3>
            <span className="text-xs text-muted">
              {formatWon(group.actual)} / {formatWon(group.planned)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent-soft">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${clampPercent(group.actual, group.planned)}%` }}
            />
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {group.items.map((item) => (
              <BudgetItemRow key={item.id} item={item} onSave={onSave} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
