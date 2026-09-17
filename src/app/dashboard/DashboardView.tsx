"use client";

import { useState } from "react";
import type { CandidateStatus } from "../workspaces/actions";
import { NewActivityBadge } from "../workspaces/NewActivityBadge";

export type WorkspaceSummary = {
  id: string;
  title: string;
  category: string;
  candidates: { status: CandidateStatus; created_at: string }[];
};

const STATUS_BAR_COLOR: Record<CandidateStatus, string> = {
  confirmed: "bg-confirmed",
  pending: "bg-pending",
  rejected: "bg-rejected",
  candidate: "bg-candidate",
};

function summarize(candidates: WorkspaceSummary["candidates"]) {
  const total = candidates.length;
  const confirmed = candidates.filter((c) => c.status === "confirmed").length;
  const pending = candidates.filter((c) => c.status === "pending").length;
  const rejected = candidates.filter((c) => c.status === "rejected").length;
  return { total, confirmed, pending, rejected };
}

/** T-036/T-037/T-038: 대시보드 — 워크플레이스 요약 카드(총/확정/보류), 상세 이동, 리스트/지도 토글. */
export function DashboardView({ workspaces }: { workspaces: WorkspaceSummary[] }) {
  const [view, setView] = useState<"list" | "map">("list");

  const totals = workspaces.reduce(
    (acc, w) => {
      const s = summarize(w.candidates);
      return { total: acc.total + s.total, confirmed: acc.confirmed + s.confirmed, pending: acc.pending + s.pending };
    },
    { total: 0, confirmed: 0, pending: 0 }
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs text-muted">전체 후보</p>
          <p className="font-display text-3xl">{totals.total}개</p>
        </div>
        <div className="rounded-2xl border border-confirmed bg-card p-5">
          <p className="text-xs text-confirmed">확정</p>
          <p className="font-display text-3xl text-confirmed">{totals.confirmed}개</p>
        </div>
        <div className="rounded-2xl border border-pending bg-card p-5">
          <p className="text-xs text-pending">확인 필요(보류)</p>
          <p className="font-display text-3xl text-pending">{totals.pending}개</p>
        </div>
      </div>

      <div className="flex justify-end gap-1 rounded-xl border border-line bg-card p-1">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-1 text-xs ${view === "list" ? "bg-ink text-paper" : "text-muted"}`}
        >
          리스트
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-lg px-3 py-1 text-xs ${view === "map" ? "bg-ink text-paper" : "text-muted"}`}
        >
          지도
        </button>
      </div>

      {view === "list" ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {workspaces.map((w) => {
            const s = summarize(w.candidates);
            const latest = w.candidates.reduce(
              (max, c) => (c.created_at > max ? c.created_at : max),
              ""
            );
            return (
              <li key={w.id}>
                <a
                  href={`/workspaces/${w.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 hover:border-accent"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg">{w.title}</p>
                      <p className="text-xs text-muted">{w.category}</p>
                    </div>
                    <NewActivityBadge workspaceId={w.id} latestActivityAt={latest || null} />
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-candidate">
                    <div
                      className={STATUS_BAR_COLOR.confirmed}
                      style={{ flexBasis: s.total ? `${(s.confirmed / s.total) * 100}%` : "0%" }}
                    />
                    <div
                      className={STATUS_BAR_COLOR.pending}
                      style={{ flexBasis: s.total ? `${(s.pending / s.total) * 100}%` : "0%" }}
                    />
                    <div
                      className={STATUS_BAR_COLOR.rejected}
                      style={{ flexBasis: s.total ? `${(s.rejected / s.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    후보 {s.total} · 확정 {s.confirmed} · 보류 {s.pending}
                  </p>
                </a>
              </li>
            );
          })}
          {workspaces.length === 0 && <li className="text-sm text-muted">아직 등록된 항목이 없습니다.</li>}
        </ul>
      ) : (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-line bg-card">
          <p className="text-sm text-muted">
            [ 네이버지도 연동 영역 — API 키 발급 후(T-039) 확정·후보 위치가 마커로 표시됩니다 ]
          </p>
        </div>
      )}
    </div>
  );
}
