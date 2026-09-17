-- T-020~T-022(참여자 목록 표시)를 위해, 같은 커플에 속한 사람끼리는 서로의 기본 프로필
-- (표시 이름/아바타)을 볼 수 있어야 한다. 기존 "profiles_select_own" 정책(본인만 조회)은
-- 그대로 두고, 같은 커플 멤버까지 열어주는 정책을 추가한다(SELECT 정책은 OR로 합쳐진다).
create or replace function public.shares_couple_with(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.couple_members me
    join public.couple_members them on them.couple_id = me.couple_id
    where me.profile_id = auth.uid() and me.status = 'accepted'
      and them.profile_id = p_profile_id
  );
$$;

create policy "profiles_select_couple_members" on public.profiles
  for select using (public.shares_couple_with(id));
