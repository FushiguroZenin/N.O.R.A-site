-- NORA support and basic abuse controls.
-- Run after creator-routing.sql and v1-operations-hardening.sql.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listing_drafts(id) on delete set null,
  category text not null check (category in ('listing_report', 'buyer_help', 'creator_help', 'account', 'privacy', 'other')),
  subject text not null check (char_length(subject) between 4 and 140),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  operator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_status_created_idx on public.support_tickets (status, created_at desc);
alter table public.support_tickets enable row level security;
drop policy if exists "reporters read own support tickets" on public.support_tickets;
create policy "reporters read own support tickets" on public.support_tickets for select using (reporter_id = auth.uid());
drop policy if exists "operators read support tickets" on public.support_tickets;
create policy "operators read support tickets" on public.support_tickets for select using (public.is_operator());

create or replace function public.create_support_ticket(p_category text, p_subject text, p_message text, p_listing_id uuid default null)
returns public.support_tickets
language plpgsql security definer set search_path = public as $$
declare ticket public.support_tickets;
begin
  if auth.uid() is null then raise exception 'Sign in before contacting NORA support.'; end if;
  if p_category not in ('listing_report', 'buyer_help', 'creator_help', 'account', 'privacy', 'other') then raise exception 'Choose a valid support category.'; end if;
  if char_length(trim(coalesce(p_subject, ''))) < 4 or char_length(trim(coalesce(p_message, ''))) < 10 then raise exception 'Please include a short subject and enough context for us to help.'; end if;
  if (select count(*) from public.support_tickets where reporter_id = auth.uid() and created_at > now() - interval '24 hours') >= 5 then raise exception 'You have reached the support-request limit for today. Please reply to an existing request or try again tomorrow.'; end if;
  insert into public.support_tickets (reporter_id, listing_id, category, subject, message)
  values (auth.uid(), p_listing_id, p_category, trim(p_subject), trim(p_message)) returning * into ticket;
  perform public.write_nora_activity('support.created', 'support_ticket', ticket.id, auth.uid(), jsonb_build_object('category', ticket.category));
  return ticket;
end;
$$;

create or replace function public.update_support_ticket(p_ticket_id uuid, p_status text, p_operator_note text default null)
returns public.support_tickets
language plpgsql security definer set search_path = public as $$
declare ticket public.support_tickets;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  if p_status not in ('open', 'in_progress', 'resolved') then raise exception 'Choose a valid support status.'; end if;
  update public.support_tickets set status = p_status, operator_note = nullif(trim(coalesce(p_operator_note, '')), ''), updated_at = now()
  where id = p_ticket_id returning * into ticket;
  if ticket.id is null then raise exception 'Support ticket not found.'; end if;
  perform public.write_nora_activity('support.' || p_status, 'support_ticket', ticket.id, ticket.reporter_id, jsonb_build_object('category', ticket.category));
  return ticket;
end;
$$;

-- Slow down repeat enquiries without blocking a legitimate buyer from revisiting later.
create or replace function public.create_acquisition_request(
  p_product_slug text, p_product_name text, p_delivery text, p_terms_requested text,
  p_intended_use text, p_organisation text, p_buyer_name text, p_buyer_email text, p_price_context text
)
returns public.acquisition_requests
language plpgsql security definer set search_path = public as $$
declare created_request public.acquisition_requests;
declare owner_id uuid;
declare dynamic_listing_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before sending an acquisition request'; end if;
  if (select count(*) from public.acquisition_requests where buyer_id = auth.uid() and created_at > now() - interval '1 hour') >= 8 then raise exception 'You have sent several requests recently. Please wait a little before sending another.'; end if;
  if exists (select 1 from public.acquisition_requests where buyer_id = auth.uid() and product_slug = p_product_slug and created_at > now() - interval '5 minutes') then raise exception 'You recently sent a request for this product. Check your Buyer workspace before sending another.'; end if;
  select creator_id into owner_id from public.catalogue_owners where product_slug = p_product_slug;
  select id into dynamic_listing_id from public.listing_drafts where id::text = p_product_slug and status = 'published';
  insert into public.acquisition_requests (buyer_id, creator_id, listing_id, product_slug, product_name, delivery, terms_requested, intended_use, organisation, buyer_name, buyer_email, price_context)
  values (auth.uid(), owner_id, dynamic_listing_id, p_product_slug, p_product_name, p_delivery, p_terms_requested, p_intended_use, nullif(p_organisation, ''), nullif(p_buyer_name, ''), coalesce(nullif(auth.jwt() ->> 'email', ''), nullif(p_buyer_email, '')), nullif(p_price_context, ''))
  returning * into created_request;
  perform public.write_nora_activity('request.created', 'acquisition_request', created_request.id, auth.uid(), jsonb_build_object('product_name', created_request.product_name));
  return created_request;
end;
$$;

grant execute on function public.create_support_ticket(text, text, text, uuid) to authenticated;
grant execute on function public.update_support_ticket(uuid, text, text) to authenticated;
grant execute on function public.create_acquisition_request(text, text, text, text, text, text, text, text, text) to authenticated;
