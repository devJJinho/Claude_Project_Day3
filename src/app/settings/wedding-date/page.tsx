// T-045: 결혼식 날짜 설정 화면.
// 로그인 전(또는 커플 미연결)이면 안내만 보여주고, 연결돼 있으면 현재 날짜를 불러와 폼을 렌더링한다.
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import WeddingDateForm from "./WeddingDateForm";

export const metadata = {
  title: "결혼식 날짜 설정",
};

export default async function WeddingDateSettingsPage() {
  const coupleId = await getCurrentCoupleId();

  if (!coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold">결혼식 날짜 설정</h1>
        <p className="max-w-md text-sm text-muted">로그인이 필요합니다.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("couples")
    .select("wedding_date")
    .eq("id", coupleId)
    .single();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-bold">결혼식 날짜 설정</h1>
      <WeddingDateForm initialWeddingDate={data?.wedding_date ?? null} />
    </main>
  );
}
