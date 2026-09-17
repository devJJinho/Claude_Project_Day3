"use client";

import { useEffect, useState } from "react";

/**
 * T-034: 새 후보/코멘트 등록 시 앱 내 배지 알림.
 * 푸시 알림은 없음(개발요청서 D) — 워크플레이스를 마지막으로 연 시각(localStorage)보다
 * 최신 활동이 있으면 점 배지를 보여준다. 워크플레이스를 열면(`markVisited`) 지워진다.
 */
export function NewActivityBadge({
  workspaceId,
  latestActivityAt,
}: {
  workspaceId: string;
  latestActivityAt: string | null;
}) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!latestActivityAt) return;
    try {
      const lastVisited = localStorage.getItem(`workspace-visited:${workspaceId}`);
      setHasNew(!lastVisited || new Date(latestActivityAt) > new Date(lastVisited));
    } catch {
      // localStorage 접근 실패는 조용히 무시(배지 없이 표시).
    }
  }, [workspaceId, latestActivityAt]);

  if (!hasNew) return null;
  return <span className="h-2 w-2 rounded-full bg-accent" aria-label="새 활동 있음" />;
}

export function markWorkspaceVisited(workspaceId: string) {
  try {
    localStorage.setItem(`workspace-visited:${workspaceId}`, new Date().toISOString());
  } catch {
    // 무시 — 배지 표시는 best-effort.
  }
}
