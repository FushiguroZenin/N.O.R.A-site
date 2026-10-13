-- Immutable buyer delivery snapshots.
-- Run after v1-operations-hardening.sql and fulfilment.sql.

create table if not exists public.product_releases (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listing_drafts(id) on delete cascade,
  version text not null,
  source_bundle_path text not null,
  source_bundle_name text not null,
  source_bundle_size bigint,
  release_notes text,
  tested_environment text,
  dependency_notes text,
  licence_name text,
  delivery_contents text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (listing_id, version)
);
create index if not exists product_releases_listing_created_idx on public.product_releases (listing_id, created_at desc);

-- Preserve any already-prepared bundle as a legacy snapshot before future releases are immutable.
insert into public.product_releases (
  listing_id, version, source_bundle_path, source_bundle_name, source_bundle_size,
  release_notes, tested_environment, dependency_notes, licence_name, delivery_contents, created_by, created_at
)
select id, coalesce(nullif(release_version, ''), 'legacy-release'), source_bundle_path,
  coalesce(nullif(source_bundle_name, ''), 'source-bundle'), source_bundle_size,
  release_notes, tested_environment, dependency_notes, licence_name, coalesce(delivery_contents, '{}'), creator_id,
  coalesce(released_at, updated_at, now())
from public.listing_drafts
where source_bundle_path is not null
on conflict (listing_id, version) do nothing;

alter table public.product_entitlements add column if not exists release_id uuid references public.product_releases(id) on delete restrict;
update public.product_entitlements entitlement
set release_id = release.id
from public.product_releases release
where release.listing_id = entitlement.listing_id
  and entitlement.release_id is null
  and release.created_at = (
    select max(candidate.created_at) from public.product_releases candidate where candidate.listing_id = entitlement.listing_id
  );

alter table public.product_releases enable row level security;
drop policy if exists "creators read own releases" on public.product_releases;
create policy "creators read own releases" on public.product_releases for select
using (exists (select 1 from public.listing_drafts where listing_drafts.id = product_releases.listing_id and listing_drafts.creator_id = auth.uid()));
drop policy if exists "buyers read entitled releases" on public.product_releases;
create policy "buyers read entitled releases" on public.product_releases for select
using (exists (select 1 from public.product_entitlements where product_entitlements.release_id = product_releases.id and product_entitlements.buyer_id = auth.uid()));
drop policy if exists "operators read releases" on public.product_releases;
create policy "operators read releases" on public.product_releases for select using (public.is_operator());

drop policy if exists "buyers read entitled release bundles" on storage.objects;
create policy "buyers read entitled release bundles" on storage.objects for select to authenticated
using (
  bucket_id = 'nora-delivery'
  and exists (
    select 1 from public.product_entitlements entitlement
    join public.product_releases release on release.id = entitlement.release_id
    where entitlement.buyer_id = auth.uid() and release.source_bundle_path = storage.objects.name
  )
);

create or replace function public.save_listing_release(
  p_listing_id uuid,
  p_release_version text,
  p_release_notes text,
  p_tested_environment text,
  p_dependency_notes text,
  p_licence_name text,
  p_delivery_contents text[],
  p_source_bundle_path text default null,
  p_source_bundle_name text default null,
  p_source_bundle_size bigint default null
)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
declare snapshot public.product_releases;
declare bundle_path text;
declare bundle_name text;
declare bundle_size bigint;
declare release_version text;
begin
  select * into listing from public.listing_drafts
  where id = p_listing_id and creator_id = auth.uid() and status = 'published' for update;
  if listing.id is null then raise exception 'Only the creator of an approved record can create a release.'; end if;
  release_version := nullif(trim(p_release_version), '');
  if release_version is null then raise exception 'Give this release a version, such as v1.0.1.'; end if;
  bundle_path := coalesce(p_source_bundle_path, listing.source_bundle_path);
  bundle_name := coalesce(p_source_bundle_name, listing.source_bundle_name);
  bundle_size := coalesce(p_source_bundle_size, listing.source_bundle_size);
  if bundle_path is null or bundle_name is null then raise exception 'Attach a private source bundle before creating a buyer release.'; end if;
  if bundle_path !~ ('^' || auth.uid()::text || '/' || p_listing_id::text || '/') then raise exception 'The bundle path does not belong to this release.'; end if;
  if exists (select 1 from public.product_releases where listing_id = p_listing_id and version = release_version) then
    raise exception 'Release version % already exists. Versions are immutable; use a new version number for an updated delivery.', release_version;
  end if;
  update public.listing_drafts set
    release_version = release_version, release_notes = nullif(trim(p_release_notes), ''),
    tested_environment = nullif(trim(p_tested_environment), ''), dependency_notes = nullif(trim(p_dependency_notes), ''),
    licence_name = nullif(trim(p_licence_name), ''), delivery_contents = coalesce(p_delivery_contents, '{}'),
    source_bundle_path = bundle_path, source_bundle_name = bundle_name, source_bundle_size = bundle_size,
    released_at = now(), updated_at = now()
  where id = p_listing_id returning * into listing;
  insert into public.product_releases (
    listing_id, version, source_bundle_path, source_bundle_name, source_bundle_size,
    release_notes, tested_environment, dependency_notes, licence_name, delivery_contents, created_by
  ) values (
    listing.id, listing.release_version, listing.source_bundle_path, listing.source_bundle_name, listing.source_bundle_size,
    listing.release_notes, listing.tested_environment, listing.dependency_notes, listing.licence_name, listing.delivery_contents, auth.uid()
  ) returning * into snapshot;
  perform public.write_nora_activity('release.created', 'release', snapshot.id, auth.uid(), jsonb_build_object('listing_id', p_listing_id, 'version', snapshot.version));
  return listing;
end;
$$;

create or replace function public.grant_request_entitlement(p_request_id uuid)
returns public.product_entitlements
language plpgsql security definer set search_path = public as $$
declare request_record public.acquisition_requests;
declare release_record public.product_releases;
declare entitlement public.product_entitlements;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  select * into request_record from public.acquisition_requests where id = p_request_id for update;
  if request_record.id is null or request_record.listing_id is null then raise exception 'This request is not for a fulfilment-enabled creator release'; end if;
  select * into release_record from public.product_releases where listing_id = request_record.listing_id order by created_at desc limit 1;
  if release_record.id is null then raise exception 'The creator has not prepared an immutable private release yet.'; end if;
  insert into public.product_entitlements (buyer_id, listing_id, release_id, source)
  values (request_record.buyer_id, request_record.listing_id, release_record.id, 'manual')
  on conflict (buyer_id, listing_id) do update set release_id = excluded.release_id, granted_at = now(), source = 'manual'
  returning * into entitlement;
  update public.acquisition_requests set status = 'acquired', updated_at = now() where id = p_request_id;
  perform public.write_nora_activity('entitlement.granted', 'acquisition_request', p_request_id, request_record.buyer_id, jsonb_build_object('listing_id', request_record.listing_id, 'release_version', release_record.version));
  return entitlement;
end;
$$;

grant execute on function public.save_listing_release(uuid, text, text, text, text, text, text[], text, text, bigint) to authenticated;
grant execute on function public.grant_request_entitlement(uuid) to authenticated;
