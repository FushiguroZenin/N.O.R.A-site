-- Buyer-readiness contract for creator listings.
-- Run after schema.sql and before using the updated product-record builder.

alter table public.listing_drafts
  add column if not exists readiness_level text not null default 'Developer required'
    check (readiness_level in ('Ready to use', 'Ready to deploy', 'Developer required')),
  add column if not exists setup_time text,
  add column if not exists required_services text[] not null default '{}',
  add column if not exists environment_variables text[] not null default '{}',
  add column if not exists setup_addon_available boolean not null default false,
  add column if not exists setup_addon_price numeric,
  add column if not exists setup_addon_scope text;
