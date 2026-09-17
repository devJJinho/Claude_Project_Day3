-- T-009: checklist 테이블. T-010: budget 테이블.
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  category text not null,
  planned_amount numeric not null default 0,
  actual_amount numeric not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.checklist_items enable row level security;
alter table public.budget_items enable row level security;

create policy "checklist_items_all_member" on public.checklist_items
  for all using (
    exists (
      select 1 from public.couple_members m
      where m.couple_id = checklist_items.couple_id and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );

create policy "budget_items_all_member" on public.budget_items
  for all using (
    exists (
      select 1 from public.couple_members m
      where m.couple_id = budget_items.couple_id and m.profile_id = auth.uid() and m.status = 'accepted'
    )
  );
