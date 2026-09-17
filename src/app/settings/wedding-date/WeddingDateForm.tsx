"use client";

// T-045: 결혼식 날짜 입력 폼 — /api/wedding-date PUT을 호출해 couples.wedding_date를 갱신한다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import DdayCountdown from "@/components/DdayCountdown";

export default function WeddingDateForm({
  initialWeddingDate,
}: {
  initialWeddingDate: string | null;
}) {
  const router = useRouter();
  const [weddingDate, setWeddingDate] = useState(initialWeddingDate ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/wedding-date", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedding_date: weddingDate || null }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "저장에 실패했습니다.");
      }

      setStatus("idle");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <DdayCountdown weddingDate={weddingDate || null} />

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <label htmlFor="wedding-date" className="text-sm text-muted">
          결혼식 날짜
        </label>
        <input
          id="wedding-date"
          type="date"
          value={weddingDate}
          onChange={(event) => setWeddingDate(event.target.value)}
          className="rounded-md border border-line bg-card px-3 py-2 text-ink"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {status === "saving" ? "저장 중..." : "저장"}
        </button>
        {status === "error" && errorMessage && (
          <p className="text-sm text-rejected">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
