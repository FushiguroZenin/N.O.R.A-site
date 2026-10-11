-- Permanent creator-owned listing deletion, including its public route and routed requests.
create or replace function public.delete_listing_record(p_listing_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in before deleting a record'; end if;
  if not exists (select 1 from public.listing_drafts where id = p_listing_id and creator_id = auth.uid()) then
    raise exception 'You can only delete your own product records';
  end if;
  delete from public.acquisition_requests where product_slug = p_listing_id::text;
  delete from public.catalogue_owners where product_slug = p_listing_id::text;
  delete from public.listing_drafts where id = p_listing_id and creator_id = auth.uid();
end;
$$;

grant execute on function public.delete_listing_record(uuid) to authenticated;
