-- NORA private delivery bundle limits. Run after fulfilment.sql.

update storage.buckets
set public = false, file_size_limit = 104857600
where id = 'nora-delivery';

drop policy if exists "creators upload own release bundles" on storage.objects;
create policy "creators upload own release bundles" on storage.objects for insert to authenticated
with check (
  bucket_id = 'nora-delivery'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(name) ~ '\.(zip|tgz|tar\.gz)$'
);

drop policy if exists "creators update own release bundles" on storage.objects;
create policy "creators update own release bundles" on storage.objects for update to authenticated
using (bucket_id = 'nora-delivery' and (storage.foldername(name))[1] = auth.uid()::text)
with check (
  bucket_id = 'nora-delivery'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(name) ~ '\.(zip|tgz|tar\.gz)$'
);
