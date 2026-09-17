import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import { CreateCoupleForm, JoinCoupleForm, InviteCodeBox } from "./InviteForms";
import { MemberList } from "./MemberList";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default async function InvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-muted">로그인이 필요합니다.</p>
      </main>
    );
  }

  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
        <h1 className="font-display text-2xl">시작하기</h1>
        <p className="text-sm text-muted">
          아직 연결된 공간이 없습니다. 새로 만들거나, 상대방이 공유한 초대 코드를 입력하세요.
        </p>
        <CreateCoupleForm />
        <JoinCoupleForm />
      </main>
    );
  }

  const { data: members } = await supabase
    .from("couple_members")
    .select("profile_id, status, joined_at, profiles(display_name)")
    .eq("couple_id", coupleId);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-2xl">참여자</h1>
      <InviteCodeBox coupleId={coupleId} />
      <MemberList
        coupleId={coupleId}
        currentUserId={user.id}
        members={(members ?? []).map((m) => ({
          profileId: m.profile_id,
          status: m.status as "invited" | "accepted",
          displayName:
            (m.profiles as unknown as { display_name: string | null } | null)?.display_name ?? "(이름 없음)",
        }))}
      />
      <div className="mt-6 border-t border-line pt-6">
        <DeleteAccountButton />
      </div>
    </main>
  );
}
