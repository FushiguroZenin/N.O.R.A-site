-- NORA release record: creator-declared compatibility, dependencies, licence, and release contents.
alter table public.listing_drafts
  add column if not exists release_version text,
  add column if not exists release_notes text,
  add column if not exists tested_environment text,
  add column if not exists dependency_notes text,
  add column if not exists licence_name text,
  add column if not exists delivery_contents text[] not null default '{}',
  add column if not exists released_at timestamptz;
