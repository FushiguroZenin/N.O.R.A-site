-- NORA verification gates. Run after nora-verify.sql and review-feedback.sql.
-- A repository-backed record may enter operations review only after the exact
-- repository linked on the record has produced a passing NORA Verify report.

alter table public.listing_drafts
  add column if not exists verification_repository_url text,
  add column if not exists verification_workflow_url text;

-- Preserve successful reports created before the repository column existed.
update public.listing_drafts
set verification_repository_url = repository_url
where verification_status = 'verified'
  and verification_repository_url is null
  and repository_url is not null;

create or replace function public.mark_verification_stale()
returns trigger
language plpgsql
set search_path = public as $$
begin
  if new.repository_url is distinct from old.repository_url
     and old.verification_status = 'verified' then
    new.verification_status := 'stale';
    new.verification_summary := 'The linked repository changed. Run NORA Verify again before submitting this record.';
  end if;
  return new;
end;
$$;

drop trigger if exists listing_repository_changed on public.listing_drafts;
create trigger listing_repository_changed
before update on public.listing_drafts
for each row execute function public.mark_verification_stale();

create or replace function public.submit_listing_for_review(p_listing_id uuid)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  select * into listing
  from public.listing_drafts
  where id = p_listing_id and creator_id = auth.uid()
  for update;

  if listing.id is null then
    raise exception 'Your product record could not be found.';
  end if;
  if listing.status not in ('draft', 'changes_requested') then
    raise exception 'Only a draft or returned record can be submitted.';
  end if;
  if coalesce(listing.repository_url, '') = '' then
    raise exception 'Add a public GitHub repository, then run NORA Verify.';
  end if;
  if listing.verification_status is distinct from 'verified'
     or listing.verification_repository_url is distinct from listing.repository_url then
    raise exception 'Run NORA Verify successfully for the repository currently linked to this record before submitting.';
  end if;

  update public.listing_drafts
  set status = 'submitted', review_note = null, updated_at = now()
  where id = p_listing_id
  returning * into listing;
  return listing;
end;
$$;

grant execute on function public.submit_listing_for_review(uuid) to authenticated;

-- Replace the early broad creator policy so a browser cannot set
-- status = 'submitted' directly and bypass the verified-build gate.
drop policy if exists "creators manage own drafts" on public.listing_drafts;
drop policy if exists "creators read own records" on public.listing_drafts;
drop policy if exists "creators create drafts" on public.listing_drafts;
drop policy if exists "creators update editable records" on public.listing_drafts;

create policy "creators read own records" on public.listing_drafts
  for select using (auth.uid() = creator_id);

create policy "creators create drafts" on public.listing_drafts
  for insert with check (auth.uid() = creator_id and status = 'draft');

create policy "creators update editable records" on public.listing_drafts
  for update
  using (auth.uid() = creator_id and status in ('draft', 'changes_requested'))
  with check (auth.uid() = creator_id and status in ('draft', 'changes_requested'));

-- Operations retains the final decision, but cannot accidentally publish a
-- record whose verified report belongs to a different repository or is stale.
create or replace function public.publish_listing(p_listing_id uuid)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  select * into listing from public.listing_drafts where id = p_listing_id and status = 'submitted' for update;
  if listing.id is null then raise exception 'Submitted record not found'; end if;
  if listing.verification_status is distinct from 'verified'
     or listing.verification_repository_url is distinct from listing.repository_url then
    raise exception 'This record does not have a current verified build for its linked repository.';
  end if;
  update public.listing_drafts
  set status = 'published', review_note = null, reviewed_at = now(), reviewer_id = auth.uid(), updated_at = now()
  where id = p_listing_id
  returning * into listing;
  insert into public.catalogue_owners (product_slug, creator_id)
  values (listing.id::text, listing.creator_id)
  on conflict (product_slug) do update set creator_id = excluded.creator_id;
  return listing;
end;
$$;

grant execute on function public.publish_listing(uuid) to authenticated;
