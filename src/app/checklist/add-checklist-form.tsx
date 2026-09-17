"use client";

import { useRef, useTransition } from "react";
import { addChecklistItem } from "./actions";

export function AddChecklistForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        startTransition(async () => {
          await addChecklistItem(formData);
          formRef.current?.reset();
        });
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        name="title"
        required
        placeholder="새 체크리스트 항목"
        disabled={isPending}
        className="flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        추가
      </button>
    </form>
  );
}
