create table if not exists public.saved_products (
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_key text not null,
  product_name text not null,
  product_url text not null,
  delivery text not null,
  created_at timestamptz default now(),
  primary key (buyer_id, product_key)
);

alter table public.saved_products enable row level security;
create policy "buyers manage saved products" on public.saved_products
  for all using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);
