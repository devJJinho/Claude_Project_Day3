-- T-018/T-019/T-020/T-021/T-023: 커플 생성, 초대 코드 발급/참여, 승인/거절, 탈퇴.
--
-- 기존 couple_members RLS에는 insert/delete 정책이 아예 없었고(가입 자체가 불가능했음), 초대
-- 코드로 참여하려는 새 사용자는 아직 멤버가 아니라서 couples를 조회할 수도 없는 닭-달걀
-- 문제가 있었다. security definer 함수로 이 경계를 명시적으로 뚫는다(is_couple_member와
-- 같은 패턴) — RLS를 우회하는 대신, 함수 안에서 권한을 직접 검사한다.
--
-- 설계 단순화: 개발요청서 D1은 "소셜 계정을 지정한 초대"라고 돼 있지만, profiles를 다른
-- 사용자가 검색/조회할 방법이 없어(본인만 조회 가능한 RLS, F 비공개 원칙과 상충) 특정 계정을
-- "지정"해서 초대할 수단이 없다. 대신 커플·추가 참여자 모두 같은 초대 코드 공유 방식으로
-- 통일한다(부부 연결과 추가 참여자 초대가 사실상 같은 메커니즘이 됨) — 이 코드를 아는 사람만
-- 참여를 "요청"할 수 있고, 기존 멤버가 승인해야 실제로 들어온다(A: 승인 필요 요건은 유지).

create or replace function public.create_my_couple()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  if exists (select 1 from public.couple_members where profile_id = auth.uid()) then
    raise exception '이미 연결된 공간이 있습니다.';
  end if;

  insert into public.couples default values returning id into v_couple_id;
  insert into public.couple_members (couple_id, profile_id, status)
  values (v_couple_id, auth.uid(), 'accepted');
  return v_couple_id;
end;
$$;

create or replace function public.ensure_invite_code(p_couple_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception '권한이 없습니다.';
  end if;

  select invite_code into v_code from public.couples where id = p_couple_id;
  if v_code is null then
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    update public.couples set invite_code = v_code where id = p_couple_id;
  end if;
  return v_code;
end;
$$;

create or replace function public.join_couple_by_invite_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  if exists (select 1 from public.couple_members where profile_id = auth.uid()) then
    raise exception '이미 연결된 공간이 있습니다.';
  end if;

  select id into v_couple_id from public.couples where invite_code = p_code;
  if v_couple_id is null then
    raise exception '유효하지 않은 초대 코드입니다.';
  end if;

  insert into public.couple_members (couple_id, profile_id, status, invited_by)
  values (v_couple_id, auth.uid(), 'invited', null)
  on conflict (couple_id, profile_id) do nothing;

  return v_couple_id;
end;
$$;

create or replace function public.approve_couple_member(p_couple_id uuid, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception '권한이 없습니다.';
  end if;
  update public.couple_members
    set status = 'accepted'
    where couple_id = p_couple_id and profile_id = p_profile_id;
end;
$$;

-- 승인 대기 중인 요청 거절, 또는 기존 멤버가 스스로 탈퇴(공간 나가기)할 때 모두 사용.
create or replace function public.leave_or_reject_couple_member(p_couple_id uuid, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_couple_member(p_couple_id) or auth.uid() = p_profile_id) then
    raise exception '권한이 없습니다.';
  end if;
  delete from public.couple_members where couple_id = p_couple_id and profile_id = p_profile_id;
end;
$$;
