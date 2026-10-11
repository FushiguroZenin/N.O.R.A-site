-- NORA review feedback: records can be returned with an actionable note, then resubmitted.
alter table public.listing_drafts
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewer_id uuid references public.profiles(id) on delete set null;

alter table public.listing_drafts drop constraint if exists listing_drafts_status_check;
alter table public.listing_drafts
  add constraint listing_drafts_status_check
  check (status in ('draft', 'submitted', 'changes_requested', 'published'));

create or replace function public.return_listing_for_changes(p_listing_id uuid, p_review_note text)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_reviewer() then raise exception 'Reviewer access is required'; end if;
  if length(trim(coalesce(p_review_note, ''))) < 8 then raise exception 'Give the creator a specific review note'; end if;
  update public.listing_drafts
  set status = 'changes_requested', review_note = trim(p_review_note), reviewed_at = now(), reviewer_id = auth.uid(), updated_at = now()
  where id = p_listing_id and status = 'submitted'
  returning * into listing;
  if listing.id is null then raise exception 'Submitted record not found'; end if;
  return listing;
end;
$$;

grant execute on function public.return_listing_for_changes(uuid, text) to authenticated;

create or replace function public.publish_listing(p_listing_id uuid)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_reviewer() then raise exception 'Reviewer access is required'; end if;
  update public.listing_drafts
  set status = 'published', review_note = null, reviewed_at = now(), reviewer_id = auth.uid(), updated_at = now()
  where id = p_listing_id and status = 'submitted'
  returning * into listing;
  if listing.id is null then raise exception 'Submitted record not found'; end if;
  insert into public.catalogue_owners (product_slug, creator_id)
  values (listing.id::text, listing.creator_id)
  on conflict (product_slug) do update set creator_id = excluded.creator_id;
  return listing;
end;
$$;
