"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** T-023: 계정 탈퇴 — 등록한 후보/코멘트는 유지되고(F), 로그인 계정만 삭제된다. */
export function DeleteAccountButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("계정을 탈퇴할까요? 등록한 후보/코멘트는 그대로 남고, 로그인 계정만 삭제됩니다.")) return;
        startTransition(async () => {
          const res = await fetch("/api/account", { method: "DELETE" });
          if (res.ok) router.push("/login");
        });
      }}
      className="text-xs text-rejected underline disabled:opacity-40"
    >
      계정 탈퇴
    </button>
  );
}
