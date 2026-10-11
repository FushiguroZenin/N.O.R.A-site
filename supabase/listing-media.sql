-- NORA listing media: one creator-owned cover image plus an optional external demo URL.
alter table public.listing_drafts
  add column if not exists cover_image_url text,
  add column if not exists demo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public listing image read" on storage.objects;
drop policy if exists "Creators upload their listing images" on storage.objects;
drop policy if exists "Creators update their listing images" on storage.objects;
drop policy if exists "Creators delete their listing images" on storage.objects;

create policy "Public listing image read" on storage.objects for select
using (bucket_id = 'listing-images');

create policy "Creators upload their listing images" on storage.objects for insert to authenticated
with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Creators update their listing images" on storage.objects for update to authenticated
using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Creators delete their listing images" on storage.objects for delete to authenticated
using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));
