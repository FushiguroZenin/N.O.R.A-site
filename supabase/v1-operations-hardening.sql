-- NORA v1 operational hardening.
-- Run after verification-gates.sql, manual-fulfilment.sql, and operator-access.sql.
-- This keeps privileged actions narrow, records them, and avoids broad browser writes.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  subject_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists activity_log_resource_idx on public.activity_log (resource_type, resource_id);
alter table public.activity_log enable row level security;

drop policy if exists "operators read activity log" on public.activity_log;
create policy "operators read activity log" on public.activity_log
  for select using (public.is_operator());

create or replace function public.write_nora_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_subject_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log (actor_id, subject_user_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), p_subject_user_id, p_action, p_resource_type, p_resource_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;
revoke all on function public.write_nora_activity(text, text, uuid, uuid, jsonb) from public;

-- Published records are editable only through this narrow release function.
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
begin
  select * into listing from public.listing_drafts
  where id = p_listing_id and creator_id = auth.uid() and status = 'published'
  for update;
  if listing.id is null then raise exception 'Only the creator of an approved record can update its release details.'; end if;
  if p_source_bundle_path is not null and p_source_bundle_path !~ ('^' || auth.uid()::text || '/' || p_listing_id::text || '/') then
    raise exception 'The bundle path does not belong to this release.';
  end if;
  update public.listing_drafts set
    release_version = nullif(trim(p_release_version), ''),
    release_notes = nullif(trim(p_release_notes), ''),
    tested_environment = nullif(trim(p_tested_environment), ''),
    dependency_notes = nullif(trim(p_dependency_notes), ''),
    licence_name = nullif(trim(p_licence_name), ''),
    delivery_contents = coalesce(p_delivery_contents, '{}'),
    source_bundle_path = coalesce(p_source_bundle_path, listing.source_bundle_path),
    source_bundle_name = coalesce(p_source_bundle_name, listing.source_bundle_name),
    source_bundle_size = coalesce(p_source_bundle_size, listing.source_bundle_size),
    released_at = now(), updated_at = now()
  where id = p_listing_id returning * into listing;
  perform public.write_nora_activity('release.updated', 'listing', p_listing_id, auth.uid(), jsonb_build_object('version', listing.release_version, 'bundle_attached', listing.source_bundle_path is not null));
  return listing;
end;
$$;
grant execute on function public.save_listing_release(uuid, text, text, text, text, text, text[], text, text, bigint) to authenticated;

-- A creator can only move a buyer conversation forward; access itself remains an operator action.
drop policy if exists "creators update routed requests" on public.acquisition_requests;
create or replace function public.update_creator_request_status(p_request_id uuid, p_status text)
returns public.acquisition_requests
language plpgsql security definer set search_path = public as $$
declare request_record public.acquisition_requests;
begin
  if p_status not in ('in_conversation', 'closed') then raise exception 'Creators can only mark a request in conversation or closed.'; end if;
  select * into request_record from public.acquisition_requests
  where id = p_request_id and creator_id = auth.uid() for update;
  if request_record.id is null then raise exception 'This request is not in your inbox.'; end if;
  if request_record.status in ('acquired', 'closed') then raise exception 'This request can no longer be changed from its current state.'; end if;
  update public.acquisition_requests set status = p_status, updated_at = now()
  where id = p_request_id returning * into request_record;
  perform public.write_nora_activity('request.' || p_status, 'acquisition_request', p_request_id, request_record.buyer_id, jsonb_build_object('product_name', request_record.product_name));
  return request_record;
end;
$$;
grant execute on function public.update_creator_request_status(uuid, text) to authenticated;

create or replace function public.return_listing_for_changes(p_listing_id uuid, p_review_note text)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  if length(trim(coalesce(p_review_note, ''))) < 10 then raise exception 'Give the creator specific feedback before returning this record.'; end if;
  select * into listing from public.listing_drafts where id = p_listing_id and status = 'submitted' for update;
  if listing.id is null then raise exception 'Submitted record not found'; end if;
  update public.listing_drafts set status = 'changes_requested', review_note = trim(p_review_note), reviewed_at = now(), reviewer_id = auth.uid(), updated_at = now()
  where id = p_listing_id returning * into listing;
  perform public.write_nora_activity('listing.changes_requested', 'listing', p_listing_id, listing.creator_id, jsonb_build_object('product_name', listing.product_name));
  return listing;
end;
$$;

create or replace function public.publish_listing(p_listing_id uuid)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  select * into listing from public.listing_drafts where id = p_listing_id and status = 'submitted' for update;
  if listing.id is null then raise exception 'Submitted record not found'; end if;
  if listing.verification_status is distinct from 'verified' or listing.verification_repository_url is distinct from listing.repository_url then
    raise exception 'This record does not have a current verified build for its linked repository.';
  end if;
  update public.listing_drafts set status = 'published', review_note = null, reviewed_at = now(), reviewer_id = auth.uid(), updated_at = now()
  where id = p_listing_id returning * into listing;
  insert into public.catalogue_owners (product_slug, creator_id) values (listing.id::text, listing.creator_id)
  on conflict (product_slug) do update set creator_id = excluded.creator_id;
  perform public.write_nora_activity('listing.published', 'listing', p_listing_id, listing.creator_id, jsonb_build_object('product_name', listing.product_name));
  return listing;
end;
$$;

create or replace function public.grant_request_entitlement(p_request_id uuid)
returns public.product_entitlements
language plpgsql security definer set search_path = public as $$
declare request_record public.acquisition_requests;
declare entitlement public.product_entitlements;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  select * into request_record from public.acquisition_requests where id = p_request_id for update;
  if request_record.id is null or request_record.listing_id is null then raise exception 'This request is not for a fulfilment-enabled creator release'; end if;
  if not exists (select 1 from public.listing_drafts where id = request_record.listing_id and source_bundle_path is not null) then raise exception 'The creator has not attached a private source bundle yet.'; end if;
  insert into public.product_entitlements (buyer_id, listing_id, source) values (request_record.buyer_id, request_record.listing_id, 'manual')
  on conflict (buyer_id, listing_id) do update set granted_at = now(), source = 'manual' returning * into entitlement;
  update public.acquisition_requests set status = 'acquired', updated_at = now() where id = p_request_id;
  perform public.write_nora_activity('entitlement.granted', 'acquisition_request', p_request_id, request_record.buyer_id, jsonb_build_object('listing_id', request_record.listing_id));
  return entitlement;
end;
$$;

create or replace function public.revoke_request_entitlement(p_request_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare request_record public.acquisition_requests;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  select * into request_record from public.acquisition_requests where id = p_request_id for update;
  if request_record.id is null or request_record.listing_id is null then raise exception 'This request is not for a fulfilment-enabled creator release'; end if;
  delete from public.product_entitlements where buyer_id = request_record.buyer_id and listing_id = request_record.listing_id;
  update public.acquisition_requests set status = 'in_conversation', updated_at = now() where id = p_request_id;
  perform public.write_nora_activity('entitlement.revoked', 'acquisition_request', p_request_id, request_record.buyer_id, jsonb_build_object('listing_id', request_record.listing_id));
end;
$$;

grant execute on function public.return_listing_for_changes(uuid, text) to authenticated;
grant execute on function public.publish_listing(uuid) to authenticated;
grant execute on function public.grant_request_entitlement(uuid) to authenticated;
grant execute on function public.revoke_request_entitlement(uuid) to authenticated;
