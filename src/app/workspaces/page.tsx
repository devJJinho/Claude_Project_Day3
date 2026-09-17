import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { RECOMMENDED_CATEGORIES } from "@/lib/categories";
import { createWorkspace } from "./actions";
import { NewActivityBadge } from "./NewActivityBadge";
import { DeleteWorkspaceButton } from "./DeleteWorkspaceButton";

export default async function WorkspacesPage() {
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-muted">로그인 후 커플 연결이 필요합니다.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, title, category, created_at, candidates(created_at)")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  const latestActivityOf = (w: { created_at: string; candidates: { created_at: string }[] }) =>
    w.candidates.reduce((latest, c) => (c.created_at > latest ? c.created_at : latest), w.created_at);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-bold">항목</h1>

      <ul className="flex flex-col gap-3">
        {(workspaces ?? []).map((w) => (
          <li
            key={w.id}
            className="flex items-center gap-2 rounded-2xl border border-line bg-card px-5 py-4 hover:border-accent"
          >
            <a href={`/workspaces/${w.id}`} className="flex flex-1 items-center justify-between">
              <span>
                <span className="font-display block text-lg">{w.title}</span>
                <span className="text-xs text-muted">{w.category}</span>
              </span>
              <NewActivityBadge workspaceId={w.id} latestActivityAt={latestActivityOf(w)} />
            </a>
            <DeleteWorkspaceButton workspaceId={w.id} title={w.title} />
          </li>
        ))}
        {(workspaces ?? []).length === 0 && (
          <li className="text-sm text-muted">아직 등록된 항목이 없습니다.</li>
        )}
      </ul>

      <form
        action={async (formData: FormData) => {
          "use server";
          await createWorkspace(formData);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5"
      >
        <h2 className="font-display text-lg">새 항목 추가</h2>
        <input
          name="title"
          placeholder="제목 (예: 결혼식장)"
          required
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          name="category"
          placeholder="카테고리"
          required
          list="recommended-categories"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <datalist id="recommended-categories">
          {RECOMMENDED_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm text-white"
        >
          추가
        </button>
      </form>
    </main>
  );
}
