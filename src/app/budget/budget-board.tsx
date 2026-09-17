"use client";

import { useMemo, useState } from "react";
import type { BudgetItem } from "./types";
import { BudgetSummary } from "./budget-summary";
import { BudgetCategoryList } from "./budget-category-list";
import { BudgetItemForm } from "./budget-item-form";

type BudgetBoardProps = {
  initialItems: BudgetItem[];
};

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // 응답 본문이 JSON이 아닌 경우 기본 메시지로 대체.
  }
  return "요청을 처리하지 못했습니다.";
}

export function BudgetBoard({ initialItems }: BudgetBoardProps) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [listError, setListError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.planned += item.planned_amount;
        acc.actual += item.actual_amount;
        return acc;
      },
      { planned: 0, actual: 0 }
    );
  }, [items]);

  async function handleCreate(input: {
    category: string;
    planned_amount: number;
    actual_amount: number;
  }): Promise<string | null> {
    const response = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return await parseErrorMessage(response);
    }

    const { item } = (await response.json()) as { item: BudgetItem };
    setItems((prev) => [...prev, item]);
    setListError(null);
    return null;
  }

  async function handleSave(
    id: string,
    updates: { category?: string; planned_amount?: number; actual_amount?: number }
  ): Promise<string | null> {
    const response = await fetch("/api/budget", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      return await parseErrorMessage(response);
    }

    const { item } = (await response.json()) as { item: BudgetItem };
    setItems((prev) => prev.map((existing) => (existing.id === id ? item : existing)));
    setListError(null);
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <BudgetSummary totalPlanned={totals.planned} totalActual={totals.actual} />
      {listError && <p className="text-sm text-rejected">{listError}</p>}
      <BudgetCategoryList items={items} onSave={handleSave} />
      <BudgetItemForm onCreate={handleCreate} />
    </div>
  );
}
