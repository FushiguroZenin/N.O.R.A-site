-- NORA Verify v0. Run after technical-evidence.sql.
alter table public.listing_drafts
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','failed','stale')),
  add column if not exists verification_commit text,
  add column if not exists verification_runtime text,
  add column if not exists verification_checked_at timestamptz,
  add column if not exists verification_summary text;
