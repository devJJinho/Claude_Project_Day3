"use client";

import { useState } from "react";
import type { BudgetItem } from "./types";
import { formatWon } from "./format";

type BudgetItemRowProps = {
  item: BudgetItem;
  onSave: (
    id: string,
    updates: { category?: string; planned_amount?: number; actual_amount?: number }
  ) => Promise<string | null>;
};

export function BudgetItemRow({ item, onSave }: BudgetItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(item.category);
  const [planned, setPlanned] = useState(String(item.planned_amount));
  const [actual, setActual] = useState(String(item.actual_amount));

  function startEdit() {
    setCategory(item.category);
    setPlanned(String(item.planned_amount));
    setActual(String(item.actual_amount));
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    const plannedAmount = Number(planned);
    const actualAmount = Number(actual);
    if (!category.trim()) {
      setError("항목 이름을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(plannedAmount) || plannedAmount < 0 || !Number.isFinite(actualAmount) || actualAmount < 0) {
      setError("금액은 0 이상의 숫자로 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    const failure = await onSave(item.id, {
      category: category.trim(),
      planned_amount: plannedAmount,
      actual_amount: actualAmount,
    });
    setSaving(false);

    if (failure) {
      setError(failure);
      return;
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-line bg-card px-2 py-1 text-sm"
            placeholder="항목 이름"
          />
          <input
            type="number"
            min={0}
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
            className="w-28 rounded-md border border-line bg-card px-2 py-1 text-sm"
            placeholder="예산"
          />
          <input
            type="number"
            min={0}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="w-28 rounded-md border border-line bg-card px-2 py-1 text-sm"
            placeholder="지출"
          />
        </div>
        {error && <p className="text-xs text-rejected">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-md border border-line px-3 py-1 text-xs text-muted"
          >
            취소
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-paper">
      <span className="text-sm">{item.category}</span>
      <span className="flex items-center gap-3">
        <span className="text-sm text-muted">
          {formatWon(item.actual_amount)} / {formatWon(item.planned_amount)}
        </span>
        <button
          type="button"
          onClick={startEdit}
          className="text-xs text-accent underline underline-offset-2"
        >
          수정
        </button>
      </span>
    </li>
  );
}
