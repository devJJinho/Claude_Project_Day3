"use client";

import { useState, type FormEvent } from "react";
import { RECOMMENDED_CATEGORIES } from "@/lib/categories";

type BudgetItemFormProps = {
  onCreate: (input: {
    category: string;
    planned_amount: number;
    actual_amount: number;
  }) => Promise<string | null>;
};

export function BudgetItemForm({ onCreate }: BudgetItemFormProps) {
  const [category, setCategory] = useState("");
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const plannedAmount = planned.trim() === "" ? 0 : Number(planned);
    const actualAmount = actual.trim() === "" ? 0 : Number(actual);

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
    const failure = await onCreate({
      category: category.trim(),
      planned_amount: plannedAmount,
      actual_amount: actualAmount,
    });
    setSaving(false);

    if (failure) {
      setError(failure);
      return;
    }
    setCategory("");
    setPlanned("");
    setActual("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5"
    >
      <h3 className="font-display text-base font-bold">항목 추가</h3>
      <div className="flex flex-wrap gap-2">
        <input
          list="budget-category-suggestions"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="항목 이름 (예: 결혼식장)"
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm"
        />
        <datalist id="budget-category-suggestions">
          {RECOMMENDED_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <input
          type="number"
          min={0}
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          placeholder="예산(원)"
          className="w-32 rounded-md border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          placeholder="지출(원)"
          className="w-32 rounded-md border border-line bg-paper px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-xs text-rejected">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "추가 중…" : "추가"}
      </button>
    </form>
  );
}
