-- T-033: 후보 사진 업로드용 Storage 버킷.
-- 공개(public) 버킷으로 만든다 — URL에 임의 uuid 경로가 포함돼 추측이 어렵고, 후보 사진 자체는
-- F(개인정보 비공개)가 지키려는 민감정보(누가 어떤 후보를 등록했는지, 코멘트 등)와 달리 업체
-- 사진이라 노출 민감도가 낮다고 판단한 단순화다. 업로드/삭제는 로그인한 사용자만 가능하다.
insert into storage.buckets (id, name, public)
values ('candidate-photos', 'candidate-photos', true)
on conflict (id) do nothing;

create policy "candidate_photos_public_read" on storage.objects
  for select using (bucket_id = 'candidate-photos');

create policy "candidate_photos_auth_insert" on storage.objects
  for insert with check (bucket_id = 'candidate-photos' and auth.role() = 'authenticated');

create policy "candidate_photos_auth_delete" on storage.objects
  for delete using (bucket_id = 'candidate-photos' and auth.role() = 'authenticated');
