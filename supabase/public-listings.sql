-- Public, generated listings. Published records become readable to catalogue visitors.

drop policy if exists "public reads published listings" on public.listing_drafts;
create policy "public reads published listings" on public.listing_drafts
  for select using (status = 'published');

create or replace function public.publish_listing(p_listing_id uuid)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_reviewer() then raise exception 'Reviewer access is required'; end if;
  update public.listing_drafts
  set status = 'published', updated_at = now()
  where id = p_listing_id and status = 'submitted'
  returning * into listing;
  if listing.id is null then raise exception 'Submitted record not found'; end if;
  insert into public.catalogue_owners (product_slug, creator_id)
  values (listing.id::text, listing.creator_id)
  on conflict (product_slug) do update set creator_id = excluded.creator_id;
  return listing;
end;
$$;

grant execute on function public.publish_listing(uuid) to authenticated;
