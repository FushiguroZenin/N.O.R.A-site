-- Temporary operations flow while payment webhooks are not connected.
-- Run after acquisition-requests.sql, review-workspace.sql, listing-pricing.sql,
-- and fulfilment.sql.

alter table public.acquisition_requests
  add column if not exists listing_id uuid references public.listing_drafts(id) on delete set null;

drop policy if exists "reviewers read acquisition requests" on public.acquisition_requests;
create policy "reviewers read acquisition requests"
on public.acquisition_requests for select
using (public.is_reviewer());

-- Preserve the public client function while recording the generated-listing ID
-- when the request came from a NORA creator release.
drop function if exists public.create_acquisition_request(text, text, text, text, text, text, text, text, text);
create or replace function public.create_acquisition_request(
  p_product_slug text, p_product_name text, p_delivery text, p_terms_requested text,
  p_intended_use text, p_organisation text, p_buyer_name text, p_buyer_email text,
  p_price_context text
)
returns public.acquisition_requests
language plpgsql security definer set search_path = public as $$
declare created_request public.acquisition_requests;
declare owner_id uuid;
declare dynamic_listing_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before sending an acquisition request'; end if;
  select creator_id into owner_id from public.catalogue_owners where product_slug = p_product_slug;
  select id into dynamic_listing_id from public.listing_drafts where id::text = p_product_slug and status = 'published';
  insert into public.acquisition_requests (buyer_id, creator_id, listing_id, product_slug, product_name, delivery, terms_requested, intended_use, organisation, buyer_name, buyer_email, price_context)
  values (auth.uid(), owner_id, dynamic_listing_id, p_product_slug, p_product_name, p_delivery, p_terms_requested, p_intended_use, nullif(p_organisation, ''), nullif(p_buyer_name, ''), coalesce(nullif(auth.jwt() ->> 'email', ''), nullif(p_buyer_email, '')), nullif(p_price_context, ''))
  returning * into created_request;
  return created_request;
end;
$$;
grant execute on function public.create_acquisition_request(text, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.grant_request_entitlement(p_request_id uuid)
returns public.product_entitlements
language plpgsql security definer set search_path = public as $$
declare request_record public.acquisition_requests;
declare entitlement public.product_entitlements;
begin
  if not public.is_reviewer() then raise exception 'Reviewer access is required'; end if;
  select * into request_record from public.acquisition_requests where id = p_request_id;
  if request_record.id is null or request_record.listing_id is null then raise exception 'This request is not for a fulfilment-enabled creator release'; end if;
  insert into public.product_entitlements (buyer_id, listing_id, source)
  values (request_record.buyer_id, request_record.listing_id, 'manual')
  on conflict (buyer_id, listing_id) do update set granted_at = now(), source = 'manual'
  returning * into entitlement;
  update public.acquisition_requests set status = 'acquired', updated_at = now() where id = p_request_id;
  return entitlement;
end;
$$;

create or replace function public.revoke_request_entitlement(p_request_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare request_record public.acquisition_requests;
begin
  if not public.is_reviewer() then raise exception 'Reviewer access is required'; end if;
  select * into request_record from public.acquisition_requests where id = p_request_id;
  if request_record.id is null or request_record.listing_id is null then raise exception 'This request is not for a fulfilment-enabled creator release'; end if;
  delete from public.product_entitlements where buyer_id = request_record.buyer_id and listing_id = request_record.listing_id;
  update public.acquisition_requests set status = 'in_conversation', updated_at = now() where id = p_request_id;
end;
$$;

grant execute on function public.grant_request_entitlement(uuid) to authenticated;
grant execute on function public.revoke_request_entitlement(uuid) to authenticated;
