"use client";

import { useTransition } from "react";
import { toggleChecklistItem } from "./actions";

export type ChecklistItem = {
  id: string;
  title: string;
  is_done: boolean;
};

export function ChecklistList({ items }: { items: ChecklistItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-muted">아직 등록된 항목이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3"
        >
          <input
            type="checkbox"
            checked={item.is_done}
            disabled={isPending}
            onChange={(event) => {
              const nextDone = event.target.checked;
              startTransition(async () => {
                await toggleChecklistItem(item.id, nextDone);
              });
            }}
            className="h-4 w-4 accent-accent"
            aria-label={`${item.title} 완료 여부`}
          />
          <span className={item.is_done ? "text-muted line-through" : "text-ink"}>
            {item.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
