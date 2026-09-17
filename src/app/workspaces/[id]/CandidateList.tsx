"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateCandidateStatus, deleteCandidate, editCandidate, type CandidateStatus } from "../actions";
import { uploadCandidatePhoto } from "../photo-actions";
import { markWorkspaceVisited } from "../NewActivityBadge";

export type Candidate = {
  id: string;
  name: string | null;
  link: string | null;
  location: string | null;
  comment: string | null;
  price_range: string | null;
  photo_url: string | null;
  reservation_status: string | null;
  reservation_date: string | null;
  rating: number | null;
  status: CandidateStatus;
  created_at: string;
};

const STATUS_LABEL: Record<CandidateStatus, string> = {
  candidate: "후보",
  pending: "보류",
  rejected: "탈락",
  confirmed: "확정",
};

const STATUS_COLOR: Record<CandidateStatus, string> = {
  candidate: "bg-candidate text-ink",
  pending: "bg-pending-soft text-pending",
  rejected: "bg-rejected/30 text-rejected",
  confirmed: "bg-confirmed-soft text-confirmed",
};

/** T-032 후보 리스트 뷰 + T-031 상태 변경 + T-035 실시간 반영. */
export function CandidateList({
  workspaceId,
  initialCandidates,
}: {
  workspaceId: string;
  initialCandidates: Candidate[];
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isPending, startTransition] = useTransition();
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    markWorkspaceVisited(workspaceId);
  }, [workspaceId]);

  // T-056 이후 candidates.photo_url은 공개 URL이 아니라 스토리지 경로다 — 표시 시점마다
  // signed URL을 새로 발급한다(커플 멤버가 아니면 select 정책에 막혀 발급 자체가 실패한다).
  useEffect(() => {
    const paths = candidates.map((c) => c.photo_url).filter((p): p is string => Boolean(p));
    if (paths.length === 0) return;

    const supabase = createClient();
    supabase.storage
      .from("candidate-photos")
      .createSignedUrls(paths, 60 * 10)
      .then(({ data }) => {
        if (!data) return;
        setSignedPhotoUrls((prev) => {
          const next = { ...prev };
          for (const item of data) {
            if (item.signedUrl && item.path) next[item.path] = item.signedUrl;
          }
          return next;
        });
      });
  }, [candidates]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`workspace-${workspaceId}-candidates`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          setCandidates((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Candidate;
              return prev.some((c) => c.id === next.id) ? prev : [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Candidate;
              return prev.map((c) => (c.id === next.id ? next : c));
            }
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return prev.filter((c) => c.id !== oldId);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return (
    <ul className="flex flex-col gap-3">
      {candidates.map((c) => (
        <li key={c.id} className="rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base">{c.name ?? "(이름 없음)"}</p>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
              <button
                type="button"
                onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                className="text-xs text-muted underline"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await deleteCandidate(workspaceId, c.id);
                  })
                }
                className="text-xs text-rejected underline"
              >
                삭제
              </button>
            </div>
          </div>

          {editingId === c.id && (
            <form
              action={async (formData: FormData) => {
                await editCandidate(workspaceId, c.id, formData);
                setEditingId(null);
              }}
              className="mt-2 flex flex-col gap-2 rounded-lg border border-line p-3"
            >
              <input
                name="name"
                defaultValue={c.name ?? ""}
                placeholder="이름"
                className="rounded-lg border border-line px-2 py-1 text-sm"
              />
              <input
                name="link"
                defaultValue={c.link ?? ""}
                placeholder="링크"
                className="rounded-lg border border-line px-2 py-1 text-sm"
              />
              <textarea
                name="comment"
                defaultValue={c.comment ?? ""}
                placeholder="코멘트"
                className="rounded-lg border border-line px-2 py-1 text-sm"
              />
              <button type="submit" className="self-start rounded-full bg-accent px-3 py-1 text-xs text-white">
                저장
              </button>
            </form>
          )}
          {c.photo_url && signedPhotoUrls[c.photo_url] && (
            // eslint-disable-next-line @next/next/no-img-element -- 만료되는 signed URL, next/image 캐시 대상 아님
            <img
              src={signedPhotoUrls[c.photo_url]}
              alt={c.name ?? "후보 사진"}
              className="mt-2 h-32 w-full rounded-lg object-cover"
            />
          )}
          {c.comment && <p className="mt-1 text-sm text-muted">{c.comment}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            {c.location && <span>{c.location}</span>}
            {c.price_range && <span>{c.price_range}</span>}
            {c.link && (
              <a href={c.link} target="_blank" rel="noreferrer" className="text-accent">
                링크
              </a>
            )}
          </div>
          <form
            action={async (formData: FormData) => {
              await uploadCandidatePhoto(workspaceId, c.id, formData);
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input type="file" name="photo" accept="image/*" className="text-xs" />
            <button type="submit" className="rounded-full border border-line px-2 py-0.5 text-xs">
              사진 업로드
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABEL) as CandidateStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                disabled={isPending || c.status === status}
                onClick={() =>
                  startTransition(async () => {
                    await updateCandidateStatus(workspaceId, c.id, status);
                  })
                }
                className={`rounded-full border border-line px-2 py-0.5 text-xs disabled:opacity-40 ${
                  c.status === status ? "border-accent" : ""
                }`}
              >
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>
        </li>
      ))}
      {candidates.length === 0 && <li className="text-sm text-muted">아직 등록된 후보가 없습니다.</li>}
    </ul>
  );
}
