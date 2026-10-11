-- NORA review workspace: only designated reviewers can see and move submitted records.

alter table public.profiles add column if not exists is_reviewer boolean not null default false;

create or replace function public.is_reviewer()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_reviewer from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_reviewer() to authenticated;

drop policy if exists "reviewers read submitted drafts" on public.listing_drafts;
create policy "reviewers read submitted drafts" on public.listing_drafts
  for select using (status = 'submitted' and public.is_reviewer());

drop policy if exists "reviewers update submitted drafts" on public.listing_drafts;
create policy "reviewers update submitted drafts" on public.listing_drafts
  for update using (status = 'submitted' and public.is_reviewer()) with check (public.is_reviewer());

-- Bootstrap the first reviewer from Supabase SQL Editor after running this file:
-- update public.profiles
-- set is_reviewer = true
-- where id = (select id from auth.users where email = 'your-email@example.com');
