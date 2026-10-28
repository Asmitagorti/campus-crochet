-- Run once in Supabase SQL Editor after 20261027_admin_password.sql.
-- Rates are entered only after checking India Post Parcel Retail's payable quote
-- from Kakinada HO 533001. No destination is enabled by this migration.
alter table public.products add column if not exists packed_weight_grams integer
  check (packed_weight_grams between 1 and 50000);

create table if not exists public.delivery_rates (
  destination_pin text not null check (destination_pin ~ '^[1-9][0-9]{5}$'),
  max_weight_grams integer not null check (max_weight_grams between 1 and 50000),
  postage_paise integer not null check (postage_paise between 1 and 1000000),
  active boolean not null default false,
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (destination_pin, max_weight_grams)
);
create index if not exists delivery_rates_quote_idx
  on public.delivery_rates(destination_pin, max_weight_grams) where active;
alter table public.delivery_rates enable row level security;
revoke all on public.delivery_rates from public, anon, authenticated;
grant all on public.delivery_rates to service_role;

alter table public.orders add column if not exists delivery_pin text;
alter table public.orders add column if not exists subtotal_paise bigint;
alter table public.orders add column if not exists postage_paise bigint not null default 0;
alter table public.orders add column if not exists delivery_paise bigint not null default 0;
alter table public.orders add column if not exists packed_weight_grams integer;
update public.orders set subtotal_paise = round(total_price * 100)::bigint
  where subtotal_paise is null;
alter table public.order_items add column if not exists product_name_at_purchase text;
update public.order_items oi set product_name_at_purchase = p.name
  from public.products p where oi.product_id = p.product_id
    and oi.product_name_at_purchase is null;

-- The same server-only quote is used for the preview and inside order creation.
create or replace function public.shop_quote_delivery(p_items jsonb, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare item jsonb; product public.products%rowtype;
  subtotal bigint := 0; weight_grams integer := 0; postage integer := 0;
  slab integer := null; line_qty integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 20 then raise exception 'Invalid bag.'; end if;
  if p_pin is not null and p_pin !~ '^[1-9][0-9]{5}$' then
    raise exception 'Please enter a valid six-digit delivery PIN.';
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'quantity', '') !~ '^[0-9]+$' then raise exception 'Invalid quantity.'; end if;
    line_qty := (item->>'quantity')::integer;
    if line_qty < 1 or line_qty > 20 then raise exception 'Invalid quantity.'; end if;
    select * into product from public.products where product_id = (item->>'productId')::uuid;
    if not found or product.is_available is not true then raise exception 'An item is unavailable.'; end if;
    subtotal := subtotal + round(product.price * line_qty * 100)::bigint;
    if p_pin is not null then
      if product.packed_weight_grams is null then
        raise exception 'Delivery weight is not set for %. Please contact support.', product.name;
      end if;
      weight_grams := weight_grams + product.packed_weight_grams * line_qty;
    end if;
  end loop;
  if p_pin is not null then
    select r.max_weight_grams, r.postage_paise into slab, postage
      from public.delivery_rates r
      where r.destination_pin = p_pin and r.active
        and r.max_weight_grams >= weight_grams
      order by r.max_weight_grams limit 1 for share;
    if not found then raise exception 'Delivery is not yet available for this PIN and parcel weight.'; end if;
  end if;
  return jsonb_build_object('subtotalPaise', subtotal, 'postagePaise', postage,
    'deliveryPaise', case when p_pin is null then 0 else postage + 1500 end,
    'totalPaise', subtotal + case when p_pin is null then 0 else postage + 1500 end,
    'weightGrams', weight_grams, 'slabGrams', slab, 'originPin', '533001');
end $$;

create or replace function public.shop_create_order(
  p_user uuid, p_items jsonb, p_key uuid, p_customer jsonb,
  p_fingerprint text, p_expected_paise bigint
) returns uuid language plpgsql security definer set search_path = public as $$
declare existing public.orders%rowtype; created_id uuid; quote jsonb;
  choice text := p_customer->>'addressChoice'; pin text;
begin
  if choice not in ('Aditya Surampalem', 'Others') or choice is null then
    raise exception 'Please select an address option.';
  end if;
  if choice = 'Others' then
    pin := p_customer->>'deliveryPin';
    if pin is null or pin !~ '^[1-9][0-9]{5}$'
      or length(trim(coalesce(p_customer->>'deliveryAddress', ''))) not between 15 and 500 then
      raise exception 'Please enter a complete address and six-digit PIN.';
    end if;
  end if;
  if p_fingerprint is null or length(p_fingerprint) <> 64 then raise exception 'Invalid checkout fingerprint'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || p_key::text, 0));
  select * into existing from public.orders where user_id = p_user and checkout_key = p_key for update;
  if found then
    if existing.checkout_fingerprint is distinct from p_fingerprint then
      raise exception 'Your bag or details changed. Start a new checkout.';
    end if;
    if round(existing.total_price * 100)::bigint <> p_expected_paise then
      raise exception 'A price has changed. Refresh checkout before paying.';
    end if;
    return existing.order_id;
  end if;
  created_id := public.cc_create_order(p_user, p_items, p_key, p_customer);
  update public.order_items oi set product_name_at_purchase = p.name
    from public.products p where oi.order_id = created_id and oi.product_id = p.product_id;
  quote := public.shop_quote_delivery(p_items, pin);
  select * into existing from public.orders where order_id = created_id for update;
  if round(existing.total_price * 100)::bigint <> (quote->>'subtotalPaise')::bigint
    or (quote->>'totalPaise')::bigint <> p_expected_paise then
    raise exception 'A price or delivery charge has changed. Refresh checkout before paying.';
  end if;
  update public.orders set
    total_price = (quote->>'totalPaise')::bigint / 100.0,
    subtotal_paise = (quote->>'subtotalPaise')::bigint,
    postage_paise = (quote->>'postagePaise')::bigint,
    delivery_paise = (quote->>'deliveryPaise')::bigint,
    packed_weight_grams = nullif((quote->>'weightGrams')::integer, 0),
    checkout_fingerprint = p_fingerprint,
    delivery_choice = choice,
    delivery_address = case when choice = 'Others' then trim(p_customer->>'deliveryAddress') else null end,
    delivery_pin = pin,
    receipt_number = coalesce(receipt_number, 'CC-' || upper(substr(replace(created_id::text, '-', ''), 1, 12)))
  where order_id = created_id;
  return created_id;
end $$;

create or replace function public.shop_order_email_payload(p_order uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'id', coalesce(o.receipt_number, o.order_id::text),
    'registeredEmail', o.customer_snapshot->>'email',
    'name', o.customer_snapshot->>'name',
    'address', case when o.delivery_choice = 'Others' then
      concat_ws(', ', o.delivery_address, o.delivery_pin) else 'Aditya Surampalem' end,
    'subtotalPaise', coalesce(o.subtotal_paise, round(o.total_price * 100)::bigint),
    'deliveryPaise', o.delivery_paise,
    'totalPaise', round(o.total_price * 100)::bigint,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'name', coalesce(oi.product_name_at_purchase, p.name, 'Handmade piece'),
      'quantity', oi.quantity, 'price', oi.price_at_purchase
    ) order by oi.order_item_id)
      from public.order_items oi left join public.products p on p.product_id = oi.product_id
      where oi.order_id = o.order_id), '[]'::jsonb)
  ) from public.orders o where o.order_id = p_order;
$$;

-- Product edits include packed shipping weight; existing weights stay null
-- until the owner measures and enters them in the admin editor.
create or replace function public.shop_save_product(
  p_id uuid, p_expected integer, p_fields jsonb, p_images jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare saved_id uuid; current_revision integer; grams integer;
begin
  grams := nullif(p_fields->>'packedWeightGrams', '')::integer;
  if grams is not null and (grams < 1 or grams > 50000) then raise exception 'Invalid packed weight.'; end if;
  if p_id is null then
    insert into public.products(slug, name, category, short_description, full_description,
      price, stock_quantity, packed_weight_grams, processing_time_days, is_available, details, display_colors, revision)
    values(p_fields->>'slug', p_fields->>'name', p_fields->>'category',
      p_fields->>'note', p_fields->>'description', (p_fields->>'price')::numeric,
      (p_fields->>'stock')::bigint, grams, 7, (p_fields->>'active')::boolean,
      p_fields->'details', p_fields->'colors', 1)
      returning product_id into saved_id;
  else
    select revision into current_revision from public.products where product_id = p_id for update;
    if not found then raise exception 'Product not found.'; end if;
    if current_revision <> p_expected then raise exception 'Product changed. Refresh before saving.'; end if;
    update public.products set name = p_fields->>'name', category = p_fields->>'category',
      short_description = p_fields->>'note', full_description = p_fields->>'description',
      price = (p_fields->>'price')::numeric, stock_quantity = (p_fields->>'stock')::bigint,
      packed_weight_grams = grams, is_available = (p_fields->>'active')::boolean,
      details = p_fields->'details', display_colors = p_fields->'colors',
      revision = revision + 1, updated_at = now()
      where product_id = p_id returning product_id into saved_id;
  end if;
  delete from public.product_images where product_id = saved_id;
  insert into public.product_images(product_id, image_url, display_order)
    select saved_id, value, (ordinality - 1)::integer
    from jsonb_array_elements_text(p_images) with ordinality;
  return saved_id;
end $$;

revoke execute on function public.shop_quote_delivery(jsonb,text) from public, anon, authenticated;
grant execute on function public.shop_quote_delivery(jsonb,text) to service_role;
revoke execute on function public.shop_create_order(uuid,jsonb,uuid,jsonb,text,bigint) from public, anon, authenticated;
grant execute on function public.shop_create_order(uuid,jsonb,uuid,jsonb,text,bigint) to service_role;
revoke execute on function public.shop_order_email_payload(uuid) from public, anon, authenticated;
grant execute on function public.shop_order_email_payload(uuid) to service_role;
revoke execute on function public.shop_save_product(uuid,integer,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.shop_save_product(uuid,integer,jsonb,jsonb) to service_role;
