-- NORA listing gallery: supplementary screenshots stored beside the cover image.
alter table public.listing_drafts
  add column if not exists gallery_image_urls text[] not null default '{}';
