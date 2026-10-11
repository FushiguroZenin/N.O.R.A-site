-- NORA fulfilment foundation: private creator bundles and buyer entitlements.
-- Run after schema.sql and release-metadata.sql.

alter table public.listing_drafts
  add column if not exists source_bundle_path text,
  add column if not exists source_bundle_name text,
  add column if not exists source_bundle_size bigint;

create table if not exists public.product_entitlements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listing_drafts(id) on delete cascade,
  granted_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual', 'payment', 'admin')),
  payment_reference text unique,
  unique (buyer_id, listing_id)
);

alter table public.product_entitlements enable row level security;

drop policy if exists "buyers read their entitlements" on public.product_entitlements;
create policy "buyers read their entitlements"
on public.product_entitlements for select
using (auth.uid() = buyer_id);

-- Payment webhooks should insert entitlements with the service role. Do not expose
-- a client-side insert policy: a buyer must never be able to grant themselves a download.

insert into storage.buckets (id, name, public)
values ('nora-delivery', 'nora-delivery', false)
on conflict (id) do update set public = false;

drop policy if exists "creators upload own release bundles" on storage.objects;
create policy "creators upload own release bundles"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'nora-delivery'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "creators update own release bundles" on storage.objects;
create policy "creators update own release bundles"
on storage.objects for update to authenticated
using (bucket_id = 'nora-delivery' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'nora-delivery' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "creators delete own release bundles" on storage.objects;
create policy "creators delete own release bundles"
on storage.objects for delete to authenticated
using (bucket_id = 'nora-delivery' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "creators read own release bundles" on storage.objects;
create policy "creators read own release bundles"
on storage.objects for select to authenticated
using (bucket_id = 'nora-delivery' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "buyers read entitled release bundles" on storage.objects;
create policy "buyers read entitled release bundles"
on storage.objects for select to authenticated
using (
  bucket_id = 'nora-delivery'
  and exists (
    select 1 from public.product_entitlements
    where product_entitlements.buyer_id = auth.uid()
      and product_entitlements.listing_id::text = (storage.foldername(name))[2]
  )
);
