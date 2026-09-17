import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/get-current-couple";
import type { CreateBudgetItemInput, UpdateBudgetItemInput } from "@/app/budget/types";

// T-047: 예산 항목 추가/수정 API(카테고리별 예산/지출).
// budget_items는 RLS로 같은 couple 멤버만 read/write 가능(이미 적용·검증됨) — 여기서도
// couple_id를 명시적으로 걸어 방어적으로 이중 확인한다.

function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function normalizeCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: CreateBudgetItemInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const category = normalizeCategory(body.category);
  if (!category) {
    return NextResponse.json({ error: "카테고리는 필수입니다." }, { status: 400 });
  }

  const plannedAmount = body.planned_amount ?? 0;
  const actualAmount = body.actual_amount ?? 0;
  if (!isValidAmount(plannedAmount) || !isValidAmount(actualAmount)) {
    return NextResponse.json(
      { error: "예산/지출 금액은 0 이상의 숫자여야 합니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("budget_items")
    .insert({
      couple_id: coupleId,
      category,
      planned_amount: plannedAmount,
      actual_amount: actualAmount,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: UpdateBudgetItemInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "수정할 항목 id가 필요합니다." }, { status: 400 });
  }

  const updates: Record<string, string | number> = {};

  if (body.category !== undefined) {
    const category = normalizeCategory(body.category);
    if (!category) {
      return NextResponse.json({ error: "카테고리는 비어 있을 수 없습니다." }, { status: 400 });
    }
    updates.category = category;
  }

  if (body.planned_amount !== undefined) {
    if (!isValidAmount(body.planned_amount)) {
      return NextResponse.json(
        { error: "예산 금액은 0 이상의 숫자여야 합니다." },
        { status: 400 }
      );
    }
    updates.planned_amount = body.planned_amount;
  }

  if (body.actual_amount !== undefined) {
    if (!isValidAmount(body.actual_amount)) {
      return NextResponse.json(
        { error: "지출 금액은 0 이상의 숫자여야 합니다." },
        { status: 400 }
      );
    }
    updates.actual_amount = body.actual_amount;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_items")
    .update(updates)
    .eq("id", body.id)
    .eq("couple_id", coupleId)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ item: data });
}
