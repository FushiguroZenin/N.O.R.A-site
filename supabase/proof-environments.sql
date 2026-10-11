-- Creator-supplied demos, sandboxes, walkthroughs, and technical proof.
-- Run after schema.sql.

alter table public.listing_drafts
  add column if not exists proof_type text not null default 'Live demo'
    check (proof_type in ('Live demo', 'Interactive sandbox', 'Guided walkthrough', 'Technical evidence')),
  add column if not exists proof_url text,
  add column if not exists proof_instructions text,
  add column if not exists proof_safe_data boolean not null default false,
  add column if not exists proof_checked_at timestamptz,
  add column if not exists proof_status text not null default 'declared'
    check (proof_status in ('declared', 'structurally_verified'));
