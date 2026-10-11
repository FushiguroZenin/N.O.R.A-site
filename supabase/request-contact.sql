alter table public.acquisition_requests
  add column if not exists buyer_name text,
  add column if not exists buyer_email text;

drop function if exists public.create_acquisition_request(text, text, text, text, text, text);
create or replace function public.create_acquisition_request(
  p_product_slug text,
  p_product_name text,
  p_delivery text,
  p_terms_requested text,
  p_intended_use text,
  p_organisation text,
  p_buyer_name text,
  p_buyer_email text
)
returns public.acquisition_requests
language plpgsql security definer set search_path = public as $$
declare created_request public.acquisition_requests;
declare owner_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before sending an acquisition request'; end if;
  select creator_id into owner_id from public.catalogue_owners where product_slug = p_product_slug;
  insert into public.acquisition_requests (
    buyer_id, creator_id, product_slug, product_name, delivery,
    terms_requested, intended_use, organisation, buyer_name, buyer_email
  ) values (
    auth.uid(), owner_id, p_product_slug, p_product_name, p_delivery,
    p_terms_requested, p_intended_use, nullif(p_organisation, ''), nullif(p_buyer_name, ''),
    coalesce(nullif(auth.jwt() ->> 'email', ''), nullif(p_buyer_email, ''))
  ) returning * into created_request;
  return created_request;
end;
$$;

grant execute on function public.create_acquisition_request(text, text, text, text, text, text, text, text) to authenticated;
