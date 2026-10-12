-- NORA Operations access.
-- Run after review-workspace.sql. Existing reviewers become operators automatically.

alter table public.profiles
  add column if not exists is_operator boolean not null default false;

-- Preserve access already granted during the reviewer-workspace prototype.
update public.profiles
set is_operator = true
where coalesce(is_reviewer, false) = true;

create or replace function public.is_operator()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_operator from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_operator() to authenticated;

-- Keep the earlier helper as a compatibility wrapper for existing review and
-- fulfilment functions. New policies should use is_operator().
create or replace function public.is_reviewer()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_operator();
$$;

drop policy if exists "reviewers read submitted drafts" on public.listing_drafts;
create policy "operators read submitted drafts" on public.listing_drafts
  for select using (status = 'submitted' and public.is_operator());

drop policy if exists "reviewers update submitted drafts" on public.listing_drafts;
create policy "operators update submitted drafts" on public.listing_drafts
  for update using (status = 'submitted' and public.is_operator())
  with check (public.is_operator());

drop policy if exists "reviewers read acquisition requests" on public.acquisition_requests;
create policy "operators read acquisition requests" on public.acquisition_requests
  for select using (public.is_operator());

-- Assign an operator manually from the Supabase SQL Editor:
-- update public.profiles
-- set is_operator = true
-- where id = (select id from auth.users where email = 'operator@example.com');
