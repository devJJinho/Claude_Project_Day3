-- T-006: couple(커플 연결) 테이블. T-011: wedding_date(D-day) 필드도 함께 만든다(같은 테이블).
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  wedding_date date,
  invite_code text unique,
  created_at timestamptz not null default now()
);

-- 참여자 테이블: 부부 + 추가 참여자(웨딩플래너/가족/친구 등, A3) 전원 동일 권한(A4 — role 구분 없음).
-- status: 'invited'(승인 대기, D1) | 'accepted'(참여 확정).
create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'accepted' check (status in ('invited', 'accepted')),
  invited_by uuid references public.profiles (id),
  joined_at timestamptz not null default now(),
  primary key (couple_id, profile_id)
);

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

-- 개발요청서 F: 초대되어 승인된(accepted) 참여자만 해당 공간에 접근 가능.
create policy "couples_select_member" on public.couples
  for select using (
    exists (
      select 1 from public.couple_members m
      where m.couple_id = couples.id and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );

create policy "couples_update_member" on public.couples
  for update using (
    exists (
      select 1 from public.couple_members m
      where m.couple_id = couples.id and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );

-- 본인이 속한 couple의 멤버 목록은 볼 수 있다(초대 대기 목록 표시, D1/T-022 용).
create policy "couple_members_select_same_couple" on public.couple_members
  for select using (
    exists (
      select 1 from public.couple_members m
      where m.couple_id = couple_members.couple_id and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );

-- 본인 초대 상태(승인/거절)는 본인만 바꿀 수 있다(T-021).
create policy "couple_members_update_own" on public.couple_members
  for update using (profile_id = auth.uid());
