"use client";

import { useTransition } from "react";
import { approveMember, rejectOrLeaveMember } from "./actions";

type Member = { profileId: string; status: "invited" | "accepted"; displayName: string };

/** T-020~T-023: 참여자 목록, 대기 중 요청 승인/거절(T-022 배지 대신 대기 섹션으로 표시), 나가기. */
export function MemberList({
  coupleId,
  currentUserId,
  members,
}: {
  coupleId: string;
  currentUserId: string;
  members: Member[];
}) {
  const [isPending, startTransition] = useTransition();
  const pending = members.filter((m) => m.status === "invited");
  const accepted = members.filter((m) => m.status === "accepted");

  return (
    <div className="flex flex-col gap-4">
      {pending.length > 0 && (
        <div className="rounded-2xl border border-pending bg-pending-soft p-5">
          <h2 className="font-display text-sm text-pending">승인 대기 {pending.length}건</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m.profileId} className="flex items-center justify-between text-sm">
                <span>{m.displayName}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await approveMember(coupleId, m.profileId); })}
                    className="rounded-full bg-confirmed px-2 py-0.5 text-xs text-white"
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await rejectOrLeaveMember(coupleId, m.profileId); })}
                    className="rounded-full border border-line px-2 py-0.5 text-xs"
                  >
                    거절
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-sm">참여 중 {accepted.length}명</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {accepted.map((m) => (
            <li key={m.profileId} className="flex items-center justify-between text-sm">
              <span>
                {m.displayName}
                {m.profileId === currentUserId && " (나)"}
              </span>
              {m.profileId === currentUserId && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(async () => { await rejectOrLeaveMember(coupleId, m.profileId); })}
                  className="text-xs text-rejected underline"
                >
                  나가기
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
