-- T-007: workspace(항목) 테이블. T-008: candidate(후보) 테이블.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  category text not null, -- 추천 카테고리 또는 사용자 직접 입력(B)
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create type public.candidate_status as enum ('candidate', 'pending', 'rejected', 'confirmed'); -- B: 후보/보류/탈락/확정

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references public.profiles (id),
  name text,
  link text,
  location text,
  lat double precision,
  lng double precision,
  comment text,
  price_range text,
  photo_url text,
  reservation_status text,
  reservation_date date,
  rating int check (rating between 1 and 5),
  status public.candidate_status not null default 'candidate', -- 항목당 확정 개수 제한 없음(B)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidates_workspace_id_idx on public.candidates (workspace_id);

alter table public.workspaces enable row level security;
alter table public.candidates enable row level security;

-- couple 구성원(accepted)만 해당 couple의 워크플레이스/후보를 읽고 쓸 수 있다(F: 기본 비공개).
create policy "workspaces_all_member" on public.workspaces
  for all using (
    exists (
      select 1 from public.couple_members m
      where m.couple_id = workspaces.couple_id and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );

create policy "candidates_all_member" on public.candidates
  for all using (
    exists (
      select 1 from public.couple_members m
      join public.workspaces w on w.id = candidates.workspace_id
      where w.id = candidates.workspace_id and m.couple_id = w.couple_id
        and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );

-- 탈퇴해도 등록한 후보/코멘트는 남는다(A): candidates.created_by를 on delete cascade가 아닌
-- set null로 둬서, profiles 행이 지워져도(계정 탈퇴) candidate 행 자체는 유지된다.
alter table public.candidates
  drop constraint candidates_created_by_fkey,
  add constraint candidates_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null;
