"use client";

import { useTransition } from "react";
import { deleteWorkspace } from "./actions";

/** T-051: 워크플레이스 삭제 — 하위 후보가 모두 함께 지워지므로 확인을 한 번 거친다. */
export function DeleteWorkspaceButton({ workspaceId, title }: { workspaceId: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        if (!confirm(`"${title}" 항목과 등록된 후보를 모두 삭제할까요? 되돌릴 수 없습니다.`)) return;
        startTransition(async () => {
          await deleteWorkspace(workspaceId);
        });
      }}
      className="shrink-0 text-xs text-rejected underline disabled:opacity-40"
    >
      삭제
    </button>
  );
}
