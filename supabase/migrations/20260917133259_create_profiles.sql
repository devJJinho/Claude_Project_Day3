-- T-005: users/profile 테이블. auth.users를 1:1로 확장한다.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 개발요청서 F: 기본 비공개. 본인 프로필은 본인만 읽고/쓸 수 있다.
-- (다른 참여자의 이름 표시 등은 couple_members join을 통해 별도 정책에서 열어준다 — T-006 참고)
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 회원가입 시 profile 레코드 자동 생성 (T-017): auth.users insert 트리거.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
