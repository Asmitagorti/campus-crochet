-- Additive storefront fields. Existing rows and order history remain intact.
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists details jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists display_colors jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists revision integer not null default 0;
create unique index if not exists products_slug_unique on public.products (slug);

create or replace function public.shop_bump_stock_revision()
returns trigger language plpgsql as $$
begin
  if new.stock_quantity is distinct from old.stock_quantity and new.revision = old.revision then
    new.revision := old.revision + 1;
  end if;
  return new;
end $$;
drop trigger if exists shop_product_stock_revision on public.products;
create trigger shop_product_stock_revision before update on public.products
  for each row execute function public.shop_bump_stock_revision();

alter table public.carts add column if not exists liked jsonb not null default '[]'::jsonb;
alter table public.support_tickets add column if not exists status text not null default 'new';

alter table public.orders add column if not exists delivery_choice text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists checkout_fingerprint text;
alter table public.orders add column if not exists email_queue_error text;
create unique index if not exists orders_checkout_key_unique on public.orders (checkout_key) where checkout_key is not null;
create unique index if not exists orders_razorpay_order_unique_idx on public.orders (razorpay_order_id)
  where razorpay_order_id is not null;
create unique index if not exists order_email_event_unique on public.notification_jobs (event_key)
  where kind in ('order_confirmation', 'order_completion');

create table if not exists public.site_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
revoke all on public.site_content from public, anon, authenticated;

create table if not exists public.journey (
  slug text primary key,
  data jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.journey enable row level security;
revoke all on public.journey from public, anon, authenticated;

-- Server routes use the secret service role after authenticating the user.
-- Browser roles receive no direct access to these new tables.

-- Remove development-era open writes. All mutations go through authenticated
-- server routes using the service role. Public catalogue reads go through the
-- storefront API, not direct PostgREST table grants.
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_colors enable row level security;
alter table public.users enable row level security;
alter table public.carts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.support_tickets enable row level security;
alter table public.request_limits enable row level security;
alter table public.custom_requests enable row level security;
alter table public.creations enable row level security;
alter table public.order_events enable row level security;

revoke all on public.products, public.product_images, public.product_colors,
  public.users, public.carts, public.orders, public.order_items,
  public.notification_jobs, public.support_tickets, public.request_limits,
  public.custom_requests, public.creations, public.order_events
  from public, anon, authenticated;
grant all on public.products, public.product_images, public.product_colors,
  public.users, public.carts, public.orders, public.order_items,
  public.notification_jobs, public.support_tickets, public.request_limits,
  public.custom_requests, public.creations, public.order_events,
  public.site_content, public.journey to service_role;

drop policy if exists "open insert products" on public.products;
drop policy if exists "open update products" on public.products;
drop policy if exists "open delete products" on public.products;
drop policy if exists "open all product_images" on public.product_images;
drop policy if exists "open all product_colors" on public.product_colors;
drop policy if exists "open insert orders" on public.orders;
drop policy if exists "open update orders" on public.orders;
drop policy if exists "open all order_items" on public.order_items;
drop policy if exists "public read users" on public.users;
drop policy if exists "public read orders" on public.orders;
drop policy if exists "public read order_items" on public.order_items;

drop policy if exists "public read products" on public.products;
drop policy if exists "public read available products" on public.products;
drop policy if exists "storefront read products" on public.products;
create policy "storefront read products" on public.products for select to anon, authenticated
  using (slug is not null and is_available = true);
drop policy if exists "public read product_images" on public.product_images;
drop policy if exists "storefront read images" on public.product_images;
create policy "storefront read images" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.product_id = product_images.product_id and p.slug is not null and p.is_available = true));
drop policy if exists "public read product_colors" on public.product_colors;
drop policy if exists "storefront read colors" on public.product_colors;
create policy "storefront read colors" on public.product_colors for select to anon, authenticated
  using (exists (select 1 from public.products p where p.product_id = product_colors.product_id and p.slug is not null and p.is_available = true));

-- Existing RPCs must not let the public key bypass the server's account and
-- payment checks. Keep is_admin() separately because an existing RLS policy may
-- refer to it; these app RPCs are callable only with the server secret key.
do $$
declare function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'cc_%'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', function_signature);
    execute format('grant execute on function %s to service_role', function_signature);
  end loop;
end $$;

-- These functions wrap the existing cc_* payment primitives. Only the server
-- secret role can call them; each order/email transition is one SQL transaction.
create or replace function public.shop_order_email_payload(p_order uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'id', coalesce(o.receipt_number, o.order_id::text),
    'registeredEmail', o.customer_snapshot->>'email',
    'name', o.customer_snapshot->>'name',
    'address', coalesce(o.delivery_choice, 'Aditya Surampalem'),
    'totalPaise', round(o.total_price * 100),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'name', p.name, 'quantity', oi.quantity, 'price', oi.price_at_purchase
    ) order by oi.order_item_id)
      from public.order_items oi join public.products p on p.product_id = oi.product_id
      where oi.order_id = o.order_id), '[]'::jsonb)
  ) from public.orders o where o.order_id = p_order;
$$;

create or replace function public.shop_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare current_attempts integer; deadline timestamptz;
begin
  if p_limit < 1 or p_seconds < 1 then raise exception 'Invalid rate limit'; end if;
  insert into public.request_limits(key, attempts, reset_at)
    values(p_key, 0, now() + make_interval(secs => p_seconds)) on conflict do nothing;
  select attempts, reset_at into current_attempts, deadline
    from public.request_limits where key = p_key for update;
  if deadline <= now() then
    update public.request_limits set attempts = 1,
      reset_at = now() + make_interval(secs => p_seconds) where key = p_key;
    return true;
  end if;
  if current_attempts >= p_limit then return false; end if;
  update public.request_limits set attempts = attempts + 1 where key = p_key;
  return true;
end $$;

create or replace function public.shop_claim_gateway(p_id uuid, p_claim uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where order_id = p_id for update;
  if not found or o.payment_status <> 'pending' or o.order_status <> 'pending' then
    raise exception 'This checkout can no longer start.';
  end if;
  if o.razorpay_order_id is not null then raise exception 'Payment already started.'; end if;
  if o.gateway_claim is not null and o.gateway_claimed_at > now() - interval '2 minutes' then
    raise exception 'Payment is being prepared. Please wait a moment.';
  end if;
  update public.orders set gateway_claim = p_claim, gateway_claimed_at = now()
    where order_id = p_id;
end $$;

create or replace function public.shop_create_order(
  p_user uuid, p_items jsonb, p_key uuid, p_customer jsonb,
  p_fingerprint text, p_expected_paise bigint
) returns uuid language plpgsql security definer set search_path = public as $$
declare existing public.orders%rowtype; created_id uuid;
begin
  if p_customer->>'addressChoice' <> 'Aditya Surampalem' then
    raise exception 'A delivery charge must be confirmed before payment outside Aditya Surampalem.';
  end if;
  if p_fingerprint is null or length(p_fingerprint) <> 64 then raise exception 'Invalid checkout fingerprint'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || p_key::text, 0));
  select * into existing from public.orders where user_id = p_user and checkout_key = p_key for update;
  if found then
    if existing.checkout_fingerprint is distinct from p_fingerprint then
      raise exception 'Your bag or details changed. Start a new checkout.';
    end if;
    return existing.order_id;
  end if;
  created_id := public.cc_create_order(p_user, p_items, p_key, p_customer);
  select * into existing from public.orders where order_id = created_id for update;
  if round(existing.total_price * 100) <> p_expected_paise then
    raise exception 'A price has changed. Refresh your bag before paying.';
  end if;
  update public.orders set
    checkout_fingerprint = p_fingerprint,
    delivery_choice = 'Aditya Surampalem',
    delivery_address = null,
    receipt_number = coalesce(receipt_number, 'CC-' || upper(substr(replace(created_id::text, '-', ''), 1, 12)))
  where order_id = created_id;
  return created_id;
end $$;

create or replace function public.shop_capture_payment(
  p_gateway text, p_payment text, p_amount bigint, p_currency text
) returns uuid language plpgsql security definer set search_path = public as $$
declare paid_id uuid; recipient_email text; direct_buy boolean; was_pending boolean; saved_cart_items jsonb; cart_user uuid;
begin
  select (customer_snapshot->>'directBuy')::boolean, user_id, payment_status = 'pending'
    into direct_buy, cart_user, was_pending from public.orders where razorpay_order_id = p_gateway for update;
  if direct_buy and was_pending then
    select items into saved_cart_items from public.carts where user_id = cart_user for update;
  end if;
  paid_id := public.cc_capture_payment(p_gateway, p_payment, p_amount, p_currency);
  if direct_buy and was_pending and saved_cart_items is not null then
    update public.carts set items = saved_cart_items, version = version + 1, updated_at = now()
      where user_id = cart_user;
  end if;
  select customer_snapshot->>'email' into recipient_email from public.orders where order_id = paid_id;
  begin
    if recipient_email is null or recipient_email = '' then raise exception 'Registered email missing from order'; end if;
    insert into public.notification_jobs(event_key, kind, recipient, payload)
      values('order_confirmation/' || paid_id, 'order_confirmation', recipient_email,
        public.shop_order_email_payload(paid_id))
      on conflict do nothing;
  exception when others then
    update public.orders set email_queue_error = left(sqlerrm, 500) where order_id = paid_id;
  end;
  return paid_id;
end $$;

create or replace function public.shop_update_fulfillment(
  p_id uuid, p_version integer, p_status text, p_actor uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; allowed text[] := array[
  'payment_received', 'yarn_selected', 'crocheting', 'quality_check', 'ready', 'completed', 'collected'
];
begin
  select * into o from public.orders where order_id = p_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.version <> p_version then raise exception 'This order changed. Refresh before saving.'; end if;
  if o.payment_status <> 'captured' then raise exception 'Only verified paid orders can be updated.'; end if;
  if o.order_status in ('cancelled', 'collected') then raise exception 'This order is closed.'; end if;
  if not (p_status = any(allowed)) then raise exception 'Invalid fulfillment status.'; end if;
  if array_position(allowed, p_status) < array_position(allowed, o.order_status) then
    raise exception 'Tracking cannot move backwards.';
  end if;
  if p_status = 'collected' and o.order_status <> 'completed' then
    raise exception 'Mark the order completed before collected.';
  end if;
  if p_status = o.order_status then return to_jsonb(o); end if;
  update public.orders set order_status = p_status,
    completed_at = case when p_status in ('completed', 'collected') then coalesce(completed_at, now()) else completed_at end,
    version = version + 1, updated_at = now()
    where order_id = p_id returning * into o;
  update public.order_items set item_status = p_status where order_id = p_id;
  insert into public.order_events(order_id, status, note, actor_id)
    values(p_id, p_status, 'Fulfillment updated.', p_actor);
  if o.custom_request_id is not null and p_status in ('crocheting', 'ready', 'completed', 'collected') then
    update public.custom_requests set
      status = case when p_status = 'crocheting' then 'in_production' when p_status = 'ready' then 'ready' else 'completed' end,
      version = version + 1, updated_at = now() where id = o.custom_request_id;
  end if;
  if p_status = 'completed' then
    begin
      insert into public.notification_jobs(event_key, kind, recipient, payload)
        values('order_completion/' || p_id, 'order_completion',
          o.customer_snapshot->>'email', public.shop_order_email_payload(p_id))
        on conflict do nothing;
    exception when others then
      update public.orders set email_queue_error = left(sqlerrm, 500) where order_id = p_id;
    end;
  end if;
  return to_jsonb(o);
end $$;

create or replace function public.shop_release_order(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; item record;
begin
  select * into o from public.orders where order_id = p_id for update;
  if not found or o.payment_status <> 'pending' or o.order_status <> 'pending' then return; end if;
  if o.stock_reserved then
    for item in select product_id, sum(quantity) as qty from public.order_items where order_id = p_id group by product_id loop
      update public.products set stock_quantity = stock_quantity + item.qty where product_id = item.product_id and stock_quantity is not null;
    end loop;
  end if;
  update public.orders set payment_status = 'failed', order_status = 'cancelled', stock_reserved = false,
    version = version + 1, updated_at = now() where order_id = p_id;
  insert into public.order_events(order_id, status, note) values(p_id, 'cancelled', 'Unpaid checkout cancelled.');
end $$;

create or replace function public.shop_claim_order_emails(p_limit integer default 10)
returns setof public.notification_jobs language sql security definer set search_path = public as $$
  update public.notification_jobs set status = 'sending', claimed_at = now(), attempts = attempts + 1
  where id in (
    select id from public.notification_jobs
    where kind in ('order_confirmation', 'order_completion')
      and status in ('pending', 'failed') and next_attempt_at <= now() and attempts < 8
    order by created_at for update skip locked limit least(greatest(p_limit, 1), 20)
  ) returning *;
$$;

create or replace function public.shop_repair_order_emails()
returns integer language plpgsql security definer set search_path = public as $$
declare o record; repaired integer := 0;
begin
  for o in select order_id, customer_snapshot, order_status from public.orders
    where checkout_fingerprint is not null and payment_status = 'captured'
      and (not exists (select 1 from public.notification_jobs j where j.event_key = 'order_confirmation/' || orders.order_id)
        or (order_status in ('completed', 'collected') and not exists
          (select 1 from public.notification_jobs j where j.event_key = 'order_completion/' || orders.order_id)))
  loop
    begin
      insert into public.notification_jobs(event_key, kind, recipient, payload)
        values('order_confirmation/' || o.order_id, 'order_confirmation',
          o.customer_snapshot->>'email', public.shop_order_email_payload(o.order_id))
        on conflict do nothing;
      if found then repaired := repaired + 1; end if;
      if o.order_status in ('completed', 'collected') then
        insert into public.notification_jobs(event_key, kind, recipient, payload)
          values('order_completion/' || o.order_id, 'order_completion',
            o.customer_snapshot->>'email', public.shop_order_email_payload(o.order_id))
          on conflict do nothing;
        if found then repaired := repaired + 1; end if;
      end if;
      update public.orders set email_queue_error = null where order_id = o.order_id and email_queue_error is not null;
    exception when others then
      update public.orders set email_queue_error = left(sqlerrm, 500) where order_id = o.order_id;
    end;
  end loop;
  return repaired;
end $$;

create or replace function public.shop_save_content(
  p_key text, p_expected integer, p_data jsonb, p_published boolean
) returns integer language plpgsql security definer set search_path = public as $$
declare current_revision integer; next_revision integer;
begin
  if p_key = 'settings' then
    insert into public.site_content(key) values('settings') on conflict do nothing;
    select revision into current_revision from public.site_content where key = 'settings' for update;
    if current_revision <> p_expected then raise exception 'This content changed. Refresh before saving.'; end if;
    update public.site_content set data = p_data, revision = revision + 1, updated_at = now()
      where key = 'settings' returning revision into next_revision;
  elsif p_key like 'journey/%' then
    insert into public.journey(slug) values(substr(p_key, 9)) on conflict do nothing;
    select revision into current_revision from public.journey where slug = substr(p_key, 9) for update;
    if current_revision <> p_expected then raise exception 'This chapter changed. Refresh before saving.'; end if;
    update public.journey set data = p_data, published = p_published,
      revision = revision + 1, updated_at = now()
      where slug = substr(p_key, 9) returning revision into next_revision;
  else raise exception 'Unknown content type.';
  end if;
  return next_revision;
end $$;

create or replace function public.shop_save_product(
  p_id uuid, p_expected integer, p_fields jsonb, p_images jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare saved_id uuid; current_revision integer;
begin
  if p_id is null then
    insert into public.products(slug, name, category, short_description, full_description,
      price, stock_quantity, processing_time_days, is_available, details, display_colors, revision)
    values(p_fields->>'slug', p_fields->>'name', p_fields->>'category',
      p_fields->>'note', p_fields->>'description', (p_fields->>'price')::numeric,
      (p_fields->>'stock')::bigint, 7, (p_fields->>'active')::boolean,
      p_fields->'details', p_fields->'colors', 1)
      returning product_id into saved_id;
  else
    select revision into current_revision from public.products where product_id = p_id for update;
    if not found then raise exception 'Product not found.'; end if;
    if current_revision <> p_expected then raise exception 'Product changed. Refresh before saving.'; end if;
    update public.products set name = p_fields->>'name', category = p_fields->>'category',
      short_description = p_fields->>'note', full_description = p_fields->>'description',
      price = (p_fields->>'price')::numeric, stock_quantity = (p_fields->>'stock')::bigint,
      is_available = (p_fields->>'active')::boolean, details = p_fields->'details',
      display_colors = p_fields->'colors', revision = revision + 1, updated_at = now()
      where product_id = p_id returning product_id into saved_id;
  end if;
  delete from public.product_images where product_id = saved_id;
  insert into public.product_images(product_id, image_url, display_order)
    select saved_id, value, (ordinality - 1)::integer
    from jsonb_array_elements_text(p_images) with ordinality;
  return saved_id;
end $$;

do $$
declare function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'shop_%'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', function_signature);
    execute format('grant execute on function %s to service_role', function_signature);
  end loop;
end $$;
