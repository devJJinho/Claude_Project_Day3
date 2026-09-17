"use client";

import { useEffect, useState, useTransition } from "react";
import { createMyCouple, joinCoupleByCode, getOrCreateInviteCode } from "./actions";

export function CreateCoupleForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-display text-lg">새 공간 만들기</h2>
      <p className="mt-1 text-xs text-muted">가장 먼저 시작하는 사람이 누르면 됩니다.</p>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await createMyCouple();
            setError(res.error);
          })
        }
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        시작하기
      </button>
      {error && <p className="mt-2 text-xs text-rejected">{error}</p>}
    </div>
  );
}

export function JoinCoupleForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData: FormData) => {
        const res = await joinCoupleByCode(formData);
        setError(res.error);
      }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5"
    >
      <h2 className="font-display text-lg">초대 코드로 참여</h2>
      <input
        name="code"
        placeholder="초대 코드"
        required
        className="rounded-lg border border-line px-3 py-2 text-sm"
      />
      <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm text-white">
        참여 요청
      </button>
      {error && <p className="text-xs text-rejected">{error}</p>}
    </form>
  );
}

export function InviteCodeBox({ coupleId }: { coupleId: string }) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateInviteCode(coupleId).then((res) => setCode(res.code));
  }, [coupleId]);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-display text-lg">내 초대 코드</h2>
      <p className="mt-1 text-xs text-muted">상대방/추가 참여자에게 이 코드를 공유하세요.</p>
      <p className="mt-3 rounded-lg bg-paper px-4 py-2 text-center font-display text-xl tracking-widest">
        {code ?? "…"}
      </p>
    </div>
  );
}
