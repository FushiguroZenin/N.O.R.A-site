-- GitHub evidence attached to creator records. Public-repository checks run client-side.
alter table public.listing_drafts add column if not exists repository_url text;
