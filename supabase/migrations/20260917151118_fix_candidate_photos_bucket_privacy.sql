-- T-056 (Critical, critical-reviewer 발견): candidate-photos 버킷이 public=true였고
-- insert/delete 정책이 '로그인만 했으면 누구나' 허용해서, 커플 멤버십 검증 없이 타 커플의
-- 사진을 업로드/삭제/열람할 수 있었다. F(기본 비공개)를 위반한 상태로 이미 프로덕션에
-- 배포돼 있었다(T-004). 버킷을 비공개로 바꾸고, 파일 경로 첫 세그먼트(workspace_id)로
-- couple 멤버십을 확인하는 정책으로 교체한다.
update storage.buckets set public = false where id = 'candidate-photos';

drop policy "candidate_photos_public_read" on storage.objects;
drop policy "candidate_photos_auth_insert" on storage.objects;
drop policy "candidate_photos_auth_delete" on storage.objects;

-- 업로드 경로 규약: "<workspace_id>/<candidate_id>-<uuid>.<ext>" (photo-actions.ts 참고).
create policy "candidate_photos_member_select" on storage.objects
  for select using (
    bucket_id = 'candidate-photos'
    and exists (
      select 1 from public.workspaces w
      where w.id::text = split_part(name, '/', 1) and public.is_couple_member(w.couple_id)
    )
  );

create policy "candidate_photos_member_insert" on storage.objects
  for insert with check (
    bucket_id = 'candidate-photos'
    and exists (
      select 1 from public.workspaces w
      where w.id::text = split_part(name, '/', 1) and public.is_couple_member(w.couple_id)
    )
  );

create policy "candidate_photos_member_delete" on storage.objects
  for delete using (
    bucket_id = 'candidate-photos'
    and exists (
      select 1 from public.workspaces w
      where w.id::text = split_part(name, '/', 1) and public.is_couple_member(w.couple_id)
    )
  );
