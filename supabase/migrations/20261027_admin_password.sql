-- Run after 20261027_designated_admin.sql.
-- The password hash is only available to server-side service-role requests.
create table if not exists public.admin_portal_credentials (
  id boolean primary key default true check (id),
  password_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_portal_credentials enable row level security;
revoke all on public.admin_portal_credentials from public, anon, authenticated;
grant select, insert, delete on public.admin_portal_credentials to service_role;

-- The site uploads product photos through its password-protected server route.
-- These restrictive policies prevent direct Storage API writes even if an old
-- permissive admin policy remains on the bucket.
drop policy if exists "campus product images server insert" on storage.objects;
create policy "campus product images server insert" on storage.objects
  as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'product_images');

drop policy if exists "campus product images server update" on storage.objects;
create policy "campus product images server update" on storage.objects
  as restrictive for update to anon, authenticated
  using (bucket_id <> 'product_images')
  with check (bucket_id <> 'product_images');

drop policy if exists "campus product images server delete" on storage.objects;
create policy "campus product images server delete" on storage.objects
  as restrictive for delete to anon, authenticated
  using (bucket_id <> 'product_images');
