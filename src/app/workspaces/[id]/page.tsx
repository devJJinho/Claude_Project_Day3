import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { addCandidate } from "../actions";
import { CandidateList, type Candidate } from "./CandidateList";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-muted">로그인 후 커플 연결이 필요합니다.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, title, category")
    .eq("id", id)
    .single();

  const { data: candidates } = await supabase
    .from("candidates")
    .select(
      "id, name, link, location, comment, price_range, photo_url, reservation_status, reservation_date, rating, status, created_at"
    )
    .eq("workspace_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="font-display text-2xl">{workspace?.title ?? "항목"}</h1>
        <p className="text-xs text-muted">{workspace?.category}</p>
      </div>

      <CandidateList workspaceId={id} initialCandidates={(candidates ?? []) as Candidate[]} />

      <form
        action={async (formData: FormData) => {
          "use server";
          await addCandidate(id, formData);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5"
      >
        <h2 className="font-display text-lg">후보 추가</h2>
        <input name="name" placeholder="이름" className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input name="link" placeholder="링크" className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input
          name="location"
          placeholder="위치"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <textarea
          name="comment"
          placeholder="코멘트 (장단점)"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          name="price_range"
          placeholder="가격대"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          name="reservation_status"
          placeholder="예약 상태"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          name="reservation_date"
          type="date"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          name="rating"
          type="number"
          min={1}
          max={5}
          placeholder="평점 (1~5)"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm text-white">
          추가
        </button>
      </form>
    </main>
  );
}
