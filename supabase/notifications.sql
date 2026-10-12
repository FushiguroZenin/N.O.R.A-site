-- NORA in-app notifications. Run after creator-routing.sql and review-feedback.sql.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notify_listing_status_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare notification_title text;
declare notification_body text;
begin
  if new.status is not distinct from old.status then return new; end if;

  if new.status = 'submitted' then
    notification_title := 'Record submitted to N.O.R.A';
    notification_body := new.product_name || ' is now in the Operations review queue.';
  elsif new.status = 'changes_requested' then
    notification_title := 'Changes requested';
    notification_body := coalesce(new.review_note, 'N.O.R.A requested updates to ' || new.product_name || '.');
  elsif new.status = 'published' then
    notification_title := 'Record is live';
    notification_body := new.product_name || ' is now visible in the N.O.R.A catalogue.';
  else
    return new;
  end if;

  insert into public.notifications(user_id, kind, title, body, href)
  values (new.creator_id, 'listing_status', notification_title, notification_body, '/account/creator#your-records');
  return new;
end;
$$;

drop trigger if exists listing_status_notification on public.listing_drafts;
create trigger listing_status_notification
after update of status on public.listing_drafts
for each row execute function public.notify_listing_status_change();

create or replace function public.notify_acquisition_request()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(user_id, kind, title, body, href)
  values (new.buyer_id, 'request_sent', 'Acquisition request sent', 'Your request for ' || new.product_name || ' is now with its creator.', '/account/buyer');

  if new.creator_id is not null then
    insert into public.notifications(user_id, kind, title, body, href)
    values (new.creator_id, 'buyer_request', 'New request for your work', 'A buyer wants to discuss ' || new.product_name || '.', '/account/creator#creator-inbox');
  end if;
  return new;
end;
$$;

drop trigger if exists acquisition_request_notification on public.acquisition_requests;
create trigger acquisition_request_notification
after insert on public.acquisition_requests
for each row execute function public.notify_acquisition_request();

create or replace function public.notify_acquisition_status_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  insert into public.notifications(user_id, kind, title, body, href)
  values (
    new.buyer_id,
    'request_status',
    'Your request was updated',
    new.product_name || ' is now marked ' || replace(new.status, '_', ' ') || '.',
    '/account/buyer'
  );
  return new;
end;
$$;

drop trigger if exists acquisition_status_notification on public.acquisition_requests;
create trigger acquisition_status_notification
after update of status on public.acquisition_requests
for each row execute function public.notify_acquisition_status_change();
