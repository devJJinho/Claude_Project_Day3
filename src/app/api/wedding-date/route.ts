// T-045: 결혼식 날짜 설정 API.
// couples.wedding_date(date)를 로그인한 사용자가 속한 커플 기준으로 조회/수정한다.
// RLS가 couple_members 소속 여부로 read/write를 막아주므로, 여기서는 로그인 여부만 확인하고
// 실제 행 접근 권한은 Supabase에 맡긴다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("couples")
    .select("wedding_date")
    .eq("id", coupleId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wedding_date: data?.wedding_date ?? null });
}

export async function PUT(request: Request) {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const weddingDate = (body as { wedding_date?: unknown })?.wedding_date;
  if (weddingDate !== null && typeof weddingDate !== "string") {
    return NextResponse.json({ error: "wedding_date는 문자열 또는 null이어야 합니다." }, { status: 400 });
  }
  if (typeof weddingDate === "string" && !DATE_ONLY_PATTERN.test(weddingDate)) {
    return NextResponse.json(
      { error: "wedding_date 형식이 올바르지 않습니다(YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("couples")
    .update({ wedding_date: weddingDate })
    .eq("id", coupleId)
    .select("wedding_date")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wedding_date: data?.wedding_date ?? null });
}
