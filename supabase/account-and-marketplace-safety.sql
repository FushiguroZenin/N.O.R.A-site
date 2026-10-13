-- NORA account and marketplace safety controls.
-- Run after notifications.sql, v1-operations-hardening.sql, and support-controls.sql.
-- This deliberately records deletion requests; it does not delete an account or
-- its transaction history automatically.

alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  add column if not exists account_status_note text,
  add column if not exists account_status_updated_at timestamptz;

alter table public.listing_drafts
  add column if not exists is_suspended boolean not null default false,
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null;

-- A suspended record remains auditable for its creator and operators, but is no
-- longer readable by catalogue visitors.
drop policy if exists "public reads published listings" on public.listing_drafts;
create policy "public reads published unsuspended listings" on public.listing_drafts
  for select using (status = 'published' and not is_suspended);

drop policy if exists "creators manage own drafts" on public.listing_drafts;
drop policy if exists "creators read own records" on public.listing_drafts;
drop policy if exists "active creators create records" on public.listing_drafts;
drop policy if exists "active creators update records" on public.listing_drafts;
drop policy if exists "active creators delete records" on public.listing_drafts;
create policy "creators read own records" on public.listing_drafts
  for select using (auth.uid() = creator_id);
create policy "active creators create records" on public.listing_drafts
  for insert with check (auth.uid() = creator_id and coalesce((select account_status from public.profiles where id = auth.uid()), 'active') = 'active');
create policy "active creators update records" on public.listing_drafts
  for update using (auth.uid() = creator_id and coalesce((select account_status from public.profiles where id = auth.uid()), 'active') = 'active')
  with check (auth.uid() = creator_id and coalesce((select account_status from public.profiles where id = auth.uid()), 'active') = 'active');
create policy "active creators delete records" on public.listing_drafts
  for delete using (auth.uid() = creator_id and coalesce((select account_status from public.profiles where id = auth.uid()), 'active') = 'active');

drop policy if exists "operators read profiles" on public.profiles;
create policy "operators read profiles" on public.profiles for select using (public.is_operator());
drop policy if exists "operators manage marketplace records" on public.listing_drafts;
create policy "operators manage marketplace records" on public.listing_drafts
  for all using (public.is_operator()) with check (public.is_operator());

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'open' check (status in ('open', 'in_review', 'closed', 'rejected')),
  operator_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists account_deletion_requests_status_created_idx on public.account_deletion_requests (status, created_at desc);
alter table public.account_deletion_requests enable row level security;
drop policy if exists "users read own deletion requests" on public.account_deletion_requests;
create policy "users read own deletion requests" on public.account_deletion_requests for select using (requester_id = auth.uid());
drop policy if exists "operators read deletion requests" on public.account_deletion_requests;
create policy "operators read deletion requests" on public.account_deletion_requests for select using (public.is_operator());

-- Enforce an account lock even for privileged RPCs that write marketplace data.
create or replace function public.enforce_active_marketplace_account()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_operator()
    and coalesce((select account_status from public.profiles where id = auth.uid()), 'active') <> 'active' then
    raise exception 'This NORA account is currently suspended. Contact support if you believe this is a mistake.';
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists listing_drafts_account_status_guard on public.listing_drafts;
create trigger listing_drafts_account_status_guard before insert or update or delete on public.listing_drafts
  for each row execute function public.enforce_active_marketplace_account();
drop trigger if exists acquisition_requests_account_status_guard on public.acquisition_requests;
create trigger acquisition_requests_account_status_guard before insert or update on public.acquisition_requests
  for each row execute function public.enforce_active_marketplace_account();
drop trigger if exists support_tickets_account_status_guard on public.support_tickets;
create trigger support_tickets_account_status_guard before insert on public.support_tickets
  for each row execute function public.enforce_active_marketplace_account();

create or replace function public.request_account_deletion(p_reason text default null)
returns public.account_deletion_requests
language plpgsql security definer set search_path = public as $$
declare request_record public.account_deletion_requests;
begin
  if auth.uid() is null then raise exception 'Sign in before requesting account deletion.'; end if;
  if exists (select 1 from public.account_deletion_requests where requester_id = auth.uid() and status in ('open', 'in_review')) then
    raise exception 'You already have an account-deletion request under review.';
  end if;
  insert into public.account_deletion_requests (requester_id, reason)
  values (auth.uid(), nullif(trim(coalesce(p_reason, '')), '')) returning * into request_record;
  perform public.write_nora_activity('account.deletion_requested', 'account_deletion_request', request_record.id, auth.uid(), '{}'::jsonb);
  return request_record;
end;
$$;

create or replace function public.update_account_deletion_request(p_request_id uuid, p_status text, p_operator_note text default null)
returns public.account_deletion_requests
language plpgsql security definer set search_path = public as $$
declare request_record public.account_deletion_requests;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  if p_status not in ('open', 'in_review', 'closed', 'rejected') then raise exception 'Choose a valid deletion-request status.'; end if;
  update public.account_deletion_requests set
    status = p_status, operator_note = nullif(trim(coalesce(p_operator_note, '')), ''),
    reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_request_id returning * into request_record;
  if request_record.id is null then raise exception 'Account-deletion request not found.'; end if;
  perform public.write_nora_activity('account.deletion_' || p_status, 'account_deletion_request', request_record.id, request_record.requester_id, '{}'::jsonb);
  return request_record;
end;
$$;

create or replace function public.set_account_status(p_user_id uuid, p_status text, p_note text default null)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare profile_record public.profiles;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'Choose a valid account status.'; end if;
  if p_status = 'suspended' and char_length(trim(coalesce(p_note, ''))) < 10 then
    raise exception 'Give a specific internal reason before suspending an account.';
  end if;
  update public.profiles set account_status = p_status, account_status_note = nullif(trim(coalesce(p_note, '')), ''), account_status_updated_at = now()
  where id = p_user_id returning * into profile_record;
  if profile_record.id is null then raise exception 'Account not found.'; end if;
  perform public.write_nora_activity('account.' || p_status, 'profile', profile_record.id, profile_record.id, '{}'::jsonb);
  insert into public.notifications (user_id, kind, title, body, href)
  values (profile_record.id, 'account_status', 'NORA account update', case when p_status = 'suspended' then 'Your NORA account has been suspended. Contact support if you believe this is a mistake.' else 'Your NORA account is active again.' end, '/support');
  return profile_record;
end;
$$;

create or replace function public.suspend_listing_record(p_listing_id uuid, p_note text)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  if char_length(trim(coalesce(p_note, ''))) < 10 then raise exception 'Give the creator a specific reason before taking down a record.'; end if;
  update public.listing_drafts set is_suspended = true, moderation_note = trim(p_note), moderated_at = now(), moderated_by = auth.uid(), updated_at = now()
  where id = p_listing_id returning * into listing;
  if listing.id is null then raise exception 'Listing record not found.'; end if;
  perform public.write_nora_activity('listing.suspended', 'listing', listing.id, listing.creator_id, jsonb_build_object('product_name', listing.product_name));
  insert into public.notifications (user_id, kind, title, body, href)
  values (listing.creator_id, 'listing_suspended', 'Record taken off the shelf', listing.product_name || ': ' || trim(p_note), '/account/creator#your-records');
  return listing;
end;
$$;

create or replace function public.restore_listing_record(p_listing_id uuid, p_note text default null)
returns public.listing_drafts
language plpgsql security definer set search_path = public as $$
declare listing public.listing_drafts;
begin
  if not public.is_operator() then raise exception 'Operator access is required'; end if;
  update public.listing_drafts set is_suspended = false, moderation_note = nullif(trim(coalesce(p_note, '')), ''), moderated_at = now(), moderated_by = auth.uid(), updated_at = now()
  where id = p_listing_id returning * into listing;
  if listing.id is null then raise exception 'Listing record not found.'; end if;
  perform public.write_nora_activity('listing.restored', 'listing', listing.id, listing.creator_id, jsonb_build_object('product_name', listing.product_name));
  insert into public.notifications (user_id, kind, title, body, href)
  values (listing.creator_id, 'listing_restored', 'Record restored to the shelf', listing.product_name || ' is publicly available again.', '/account/creator#your-records');
  return listing;
end;
$$;

create or replace function public.notify_account_deletion_status_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  insert into public.notifications (user_id, kind, title, body, href)
  values (new.requester_id, 'account_deletion', 'Account request updated', 'Your account-deletion request is now ' || replace(new.status, '_', ' ') || coalesce('. NORA: ' || new.operator_note, '.'), '/account');
  return new;
end;
$$;
drop trigger if exists account_deletion_request_notification on public.account_deletion_requests;
create trigger account_deletion_request_notification after update of status on public.account_deletion_requests
  for each row execute function public.notify_account_deletion_status_change();

grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.update_account_deletion_request(uuid, text, text) to authenticated;
grant execute on function public.set_account_status(uuid, text, text) to authenticated;
grant execute on function public.suspend_listing_record(uuid, text) to authenticated;
grant execute on function public.restore_listing_record(uuid, text) to authenticated;
