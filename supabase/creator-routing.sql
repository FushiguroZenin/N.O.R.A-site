-- NORA v0: attach the public starter catalogue to verified creator accounts,
-- then route acquisition requests only to the creator who owns that record.

create table if not exists public.catalogue_owners (
  product_slug text primary key,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.acquisition_requests
  add column if not exists creator_id uuid references public.profiles(id) on delete set null;

alter table public.catalogue_owners enable row level security;
alter table public.acquisition_requests enable row level security;

drop policy if exists "buyers manage own requests" on public.acquisition_requests;
create policy "buyers read own requests" on public.acquisition_requests
  for select using (auth.uid() = buyer_id);
create policy "creators read routed requests" on public.acquisition_requests
  for select using (auth.uid() = creator_id);
create policy "creators update routed requests" on public.acquisition_requests
  for update using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "catalogue ownership is public" on public.catalogue_owners
  for select using (true);

create or replace function public.claim_catalogue_record(p_product_slug text)
returns public.catalogue_owners
language plpgsql security definer set search_path = public as $$
declare claimed public.catalogue_owners;
declare existing_owner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before claiming a catalogue record'; end if;
  select creator_id into existing_owner from public.catalogue_owners where product_slug = p_product_slug;
  if existing_owner is not null and existing_owner <> auth.uid() then
    raise exception 'This catalogue record is already connected to another creator';
  end if;
  insert into public.catalogue_owners (product_slug, creator_id)
  values (p_product_slug, auth.uid())
  on conflict (product_slug) do update set creator_id = excluded.creator_id where public.catalogue_owners.creator_id = auth.uid()
  returning * into claimed;

  update public.acquisition_requests
  set creator_id = auth.uid()
  where product_slug = p_product_slug and creator_id is null;

  return claimed;
end;
$$;

create or replace function public.create_acquisition_request(
  p_product_slug text,
  p_product_name text,
  p_delivery text,
  p_terms_requested text,
  p_intended_use text,
  p_organisation text
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
    terms_requested, intended_use, organisation
  ) values (
    auth.uid(), owner_id, p_product_slug, p_product_name, p_delivery,
    p_terms_requested, p_intended_use, nullif(p_organisation, '')
  ) returning * into created_request;
  return created_request;
end;
$$;

grant execute on function public.claim_catalogue_record(text) to authenticated;
grant execute on function public.create_acquisition_request(text, text, text, text, text, text) to authenticated;
