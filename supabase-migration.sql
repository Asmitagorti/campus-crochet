-- ============================================================================
-- CAMPUS CROCHET — production migration
-- Run in Supabase Dashboard → SQL Editor (once).
-- 1) Creates `custom_requests` for the Custom Order workflow.
-- 2) Replaces open development RLS policies with authenticated, least-privilege
--    policies (customers see only their own rows; admin identified by email +
--    users.role = 'admin').
-- 3) Storage policies for the `product_images` bucket.
-- 4) Idempotency guard: one paid order per Razorpay order id.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

-- ── 0. helper: is_admin() ───────────────────────────────────────────────────
-- Role lives in public.users (user_id = auth.uid()). The application ALSO
-- requires the email to match ADMIN_EMAIL on every admin API call, so even if
-- RLS sees role='admin', app APIs stay locked to the designated account.
-- Anti-escalation: the "users update own row" policy below refuses to WRITE
-- role='admin', so customers cannot promote themselves via the REST API.
-- BOOTSTRAP (run once, after your first sign-in):
--   update public.users set role = 'admin' where email = 'asmileis4evr@gmail.com';
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where user_id = auth.uid()
      and lower(role) = 'admin'
  );
$$;

-- ── 1. custom_requests ──────────────────────────────────────────────────────
create table if not exists public.custom_requests (
  request_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  preferred_color text,
  size text,
  quantity integer not null default 1,
  budget numeric,
  extra_requirements text,
  reference_image_url text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'completed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_requests_user_idx on public.custom_requests (user_id, created_at desc);
create index if not exists custom_requests_status_idx on public.custom_requests (status, created_at desc);

-- ── 2. orders idempotency (duplicate-payment protection) ────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_razorpay_order_unique'
  ) then
    alter table public.orders
      add constraint orders_razorpay_order_unique unique (razorpay_order_id);
  end if;
end $$;

-- ── 3. RLS: enable everywhere ───────────────────────────────────────────────
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_colors enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.users enable row level security;
alter table public.custom_requests enable row level security;

-- ── 4. RLS: products (public catalog read; admin write) ─────────────────────
drop policy if exists "public read products" on public.products;
drop policy if exists "open insert products" on public.products;
drop policy if exists "open update products" on public.products;
drop policy if exists "open delete products" on public.products;
create policy "public read available products" on public.products
  for select using (true);
create policy "admin insert products" on public.products
  for insert with check (public.is_admin());
create policy "admin update products" on public.products
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin delete products" on public.products
  for delete using (public.is_admin());

-- ── 5. RLS: product_images / product_colors ─────────────────────────────────
drop policy if exists "public read product_images" on public.product_images;
drop policy if exists "open all product_images" on public.product_images;
drop policy if exists "public read product_colors" on public.product_colors;
drop policy if exists "open all product_colors" on public.product_colors;
create policy "public read product_images" on public.product_images for select using (true);
create policy "admin write product_images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());
create policy "public read product_colors" on public.product_colors for select using (true);
create policy "admin write product_colors" on public.product_colors
  for all using (public.is_admin()) with check (public.is_admin());

-- ── 6. RLS: users (own row; admin reads all) ────────────────────────────────
drop policy if exists "public read users" on public.users;
create policy "users read own row" on public.users
  for select using (user_id = auth.uid() or public.is_admin());
create policy "users insert own row" on public.users
  for insert with check (user_id = auth.uid() and lower(role) != 'admin');
create policy "users update own row" on public.users
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and lower(role) != 'admin');
-- NOTE: customers cannot write role='admin' through these policies, so
-- self-promotion via the REST API is blocked. The bootstrap UPDATE above
-- (run by you in the SQL editor) bypasses RLS as table owner.
drop policy if exists "admin update users" on public.users;
create policy "admin update users" on public.users
  for update using (public.is_admin()) with check (public.is_admin());

-- ── 7. RLS: orders (own orders; admin all; inserts via server after verify) ─
drop policy if exists "public read orders" on public.orders;
drop policy if exists "open update orders" on public.orders;
drop policy if exists "open insert orders" on public.orders;
create policy "users read own orders" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "users insert own orders" on public.orders
  for insert with check (user_id = auth.uid() or public.is_admin());
-- payment_status may only move to 'paid' at creation; later updates to
-- payment_status are admin-only and the API additionally refuses to flip
-- unpaid → paid without a verified Razorpay signature.
create policy "admin update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ── 8. RLS: order_items ─────────────────────────────────────────────────────
drop policy if exists "public read order_items" on public.order_items;
drop policy if exists "open all order_items" on public.order_items;
create policy "users read own order items" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.order_id = order_items.order_id and o.user_id = auth.uid())
  );
create policy "users insert own order items" on public.order_items
  for insert with check (
    public.is_admin()
    or exists (select 1 from public.orders o where o.order_id = order_items.order_id and o.user_id = auth.uid())
  );

-- ── 9. RLS: custom_requests ─────────────────────────────────────────────────
drop policy if exists "users own custom requests" on public.custom_requests;
drop policy if exists "admin all custom requests" on public.custom_requests;
create policy "users manage own requests" on public.custom_requests
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ── 10. Storage: product_images bucket ──────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product_images', 'product_images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product_images');

drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects
  for insert with check (bucket_id = 'product_images' and public.is_admin());

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update using (bucket_id = 'product_images' and public.is_admin())
  with check (bucket_id = 'product_images' and public.is_admin());

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete using (bucket_id = 'product_images' and public.is_admin());
