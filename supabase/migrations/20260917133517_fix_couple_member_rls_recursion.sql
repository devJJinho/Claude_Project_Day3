-- 버그 수정: couple_members를 참조하는 정책들이 couple_members 자신의 RLS 정책을 다시 평가하면서
-- "infinite recursion detected in policy for relation couple_members" 에러가 났다(anon 키로
-- workspaces 조회 스모크 테스트에서 확인, 2026-09-17). security definer 함수로 멤버십 확인을
-- 우회시켜 재귀를 끊는다 — 이 함수는 테이블 소유자 권한으로 실행되어 couple_members의 RLS를
-- 다시 통과하지 않는다(Supabase 표준 패턴).
create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = p_couple_id and profile_id = auth.uid() and status = 'accepted'
  );
$$;

drop policy "couples_select_member" on public.couples;
create policy "couples_select_member" on public.couples
  for select using (public.is_couple_member(id));

drop policy "couples_update_member" on public.couples;
create policy "couples_update_member" on public.couples
  for update using (public.is_couple_member(id));

drop policy "couple_members_select_same_couple" on public.couple_members;
create policy "couple_members_select_same_couple" on public.couple_members
  for select using (public.is_couple_member(couple_id));

drop policy "workspaces_all_member" on public.workspaces;
create policy "workspaces_all_member" on public.workspaces
  for all using (public.is_couple_member(couple_id));

drop policy "candidates_all_member" on public.candidates;
create policy "candidates_all_member" on public.candidates
  for all using (
    exists (
      select 1 from public.workspaces w
      where w.id = candidates.workspace_id and public.is_couple_member(w.couple_id)
    )
  );

drop policy "checklist_items_all_member" on public.checklist_items;
create policy "checklist_items_all_member" on public.checklist_items
  for all using (public.is_couple_member(couple_id));

drop policy "budget_items_all_member" on public.budget_items;
create policy "budget_items_all_member" on public.budget_items
  for all using (public.is_couple_member(couple_id));
