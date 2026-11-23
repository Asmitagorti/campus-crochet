-- Run in Supabase SQL Editor before deploying the preorder storefront.
-- Keeps the public site in poll mode. The one-month sale starts on the next
-- transition from poll to shop, and never restarts on later mode switches.

alter table public.products add column if not exists discount_price numeric;
alter table public.products drop constraint if exists products_discount_price_valid;
alter table public.products add constraint products_discount_price_valid
  check (discount_price is null or (discount_price > 0 and discount_price < price));
alter table public.site_runtime add column if not exists sale_starts_at timestamptz;
alter table public.site_runtime add column if not exists sale_ends_at timestamptz;

create or replace function public.shop_start_opening_sale()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.mode = 'shop' and old.mode is distinct from 'shop' and old.sale_starts_at is null then
    new.sale_starts_at := now();
    new.sale_ends_at := now() + interval '1 month';
  end if;
  return new;
end $$;
drop trigger if exists shop_start_opening_sale on public.site_runtime;
create trigger shop_start_opening_sale before update of mode on public.site_runtime
  for each row execute function public.shop_start_opening_sale();

-- Recalculate prices from published products. The customer cannot choose a
-- discount or delivery amount. The same transaction time governs order creation.
create or replace function public.shop_quote_delivery(p_items jsonb, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb; product public.products%rowtype;
  subtotal bigint := 0; line_qty integer; sale_active boolean := false;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 20 then raise exception 'Invalid bag.'; end if;
  if p_pin is not null and p_pin !~ '^[1-9][0-9]{5}$' then
    raise exception 'Please enter a valid six-digit delivery PIN.';
  end if;
  select coalesce(sale_ends_at > now(), false) into sale_active
    from public.site_runtime where id = true;
  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'quantity', '') !~ '^[0-9]+$' then raise exception 'Invalid quantity.'; end if;
    line_qty := (item->>'quantity')::integer;
    if line_qty < 1 or line_qty > 10 then raise exception 'Invalid quantity.'; end if;
    select * into product from public.products where product_id = (item->>'productId')::uuid;
    if not found or product.is_available is not true then raise exception 'An item is unavailable.'; end if;
    subtotal := subtotal + round((case when sale_active then
      coalesce(product.discount_price, product.price) else product.price end) * line_qty * 100)::bigint;
  end loop;
  return jsonb_build_object('subtotalPaise', subtotal, 'postagePaise', 0,
    'deliveryPaise', 0, 'totalPaise', subtotal,
    'weightGrams', 0, 'slabGrams', null, 'originPin', '533001');
end $$;
revoke execute on function public.shop_quote_delivery(jsonb,text) from public, anon, authenticated;
grant execute on function public.shop_quote_delivery(jsonb,text) to service_role;

-- This is the existing stock-safe order function with the price read switched
-- to the current opening-sale price. Product stock is null for made-to-order.
create or replace function public.cc_create_order(p_user uuid, p_items jsonb, p_key uuid, p_customer jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare oid uuid; i record; p public.products%rowtype; total numeric := 0;
  sale_active boolean := false; unit_price numeric;
begin
  perform public.cc_cancel_expired();
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || p_key::text, 0));
  select order_id into oid from public.orders where user_id = p_user and checkout_key = p_key;
  if oid is not null then return oid; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0
    or jsonb_array_length(p_items) > 20 then raise exception 'Invalid cart'; end if;
  select coalesce(sale_ends_at > now(), false) into sale_active
    from public.site_runtime where id = true;
  for i in select (x->>'productId')::uuid pid, sum((x->>'quantity')::numeric) qty
    from jsonb_array_elements(p_items) x group by 1 order by 1 loop
    select * into p from public.products where product_id = i.pid for update;
    if not found or p.is_available is not true then raise exception 'An item is unavailable'; end if;
    if i.qty < 1 or i.qty > 10 or trunc(i.qty) <> i.qty then
      raise exception 'Quantity must be an integer between 1 and 10'; end if;
    if p.stock_quantity is not null and p.stock_quantity < i.qty then
      raise exception 'Insufficient stock for %', p.name; end if;
    unit_price := case when sale_active then coalesce(p.discount_price, p.price) else p.price end;
    total := total + unit_price * i.qty;
  end loop;
  insert into public.orders(user_id,total_price,payment_status,order_status,checkout_key,customer_snapshot,stock_reserved)
    values(p_user,total,'pending','pending',p_key,p_customer,true) returning order_id into oid;
  for i in select x from jsonb_array_elements(p_items) x loop
    select * into p from public.products where product_id = (i.x->>'productId')::uuid;
    if (i.x->>'quantity')::numeric < 1 or trunc((i.x->>'quantity')::numeric) <> (i.x->>'quantity')::numeric
      then raise exception 'Invalid quantity'; end if;
    -- The storefront sells the pictured design and does not offer a colour
    -- selector. Older product_colors rows must not block its Default choice.
    unit_price := case when sale_active then coalesce(p.discount_price, p.price) else p.price end;
    insert into public.order_items(order_id,product_id,selected_color,quantity,price_at_purchase,processing_time_days,item_status)
      values(oid,p.product_id,coalesce(nullif(i.x->>'color',''),'Default'),
        (i.x->>'quantity')::integer,unit_price,p.processing_time_days,'pending');
    update public.products set stock_quantity = stock_quantity - (i.x->>'quantity')::integer
      where product_id = p.product_id and stock_quantity is not null;
  end loop;
  insert into public.order_events(order_id,status,note)
    values(oid,'pending','Order placed. Awaiting payment.');
  return oid;
end $$;
revoke execute on function public.cc_create_order(uuid,jsonb,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.cc_create_order(uuid,jsonb,uuid,jsonb) to service_role;

create or replace function public.shop_update_fulfillment(
  p_id uuid, p_version integer, p_status text, p_actor uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; allowed text[] := array[
  'payment_received', 'yarn_selected', 'crocheting', 'quality_check',
  'ready', 'completed', 'dispatched', 'collected'
];
begin
  select * into o from public.orders where order_id = p_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.version <> p_version then raise exception 'This order changed. Refresh before saving.'; end if;
  if o.payment_status <> 'captured' then raise exception 'Only verified paid orders can be updated.'; end if;
  if o.order_status in ('cancelled', 'collected', 'dispatched') then raise exception 'This order is closed.'; end if;
  if not (p_status = any(allowed)) then raise exception 'Invalid fulfillment status.'; end if;
  if array_position(allowed, p_status) < array_position(allowed, o.order_status) then
    raise exception 'Tracking cannot move backwards.';
  end if;
  if p_status in ('dispatched', 'collected') and o.order_status <> 'completed' then
    raise exception 'Mark the order finished before handoff.';
  end if;
  if p_status = 'dispatched' and o.delivery_choice is distinct from 'Others' then
    raise exception 'Only home delivery orders can be dispatched.';
  end if;
  if p_status = 'collected' and o.delivery_choice = 'Others' then
    raise exception 'Home delivery orders should be dispatched.';
  end if;
  if p_status = o.order_status then return to_jsonb(o); end if;
  update public.orders set order_status = p_status,
    completed_at = case when p_status in ('completed', 'dispatched', 'collected')
      then coalesce(completed_at, now()) else completed_at end,
    version = version + 1, updated_at = now()
    where order_id = p_id returning * into o;
  update public.order_items set item_status = p_status where order_id = p_id;
  insert into public.order_events(order_id, status, note, actor_id)
    values(p_id, p_status, 'Fulfillment updated.', p_actor);
  if o.custom_request_id is not null and p_status in ('crocheting', 'ready', 'completed', 'dispatched', 'collected') then
    update public.custom_requests set
      status = case when p_status = 'crocheting' then 'in_production'
        when p_status = 'ready' then 'ready' else 'completed' end,
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
revoke execute on function public.shop_update_fulfillment(uuid,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.shop_update_fulfillment(uuid,integer,text,uuid) to service_role;

-- Keep private draft publishing atomic with the poll/shop switch. Regular
-- prices remain in products.price; discount_price is optional and time-bound.
create or replace function public.shop_publish_and_open(p_expected integer)
returns void language plpgsql security definer set search_path = '' as $$
declare draft record; names text[]; content jsonb; state_mode text;
  draft_revision integer;
begin
  select mode into state_mode from public.site_runtime where id = true for update;
  if state_mode is distinct from 'poll' then
    raise exception 'Show the poll before publishing shop changes.';
  end if;
  select revision into draft_revision from public.shop_draft_state where id = true for update;
  if draft_revision is distinct from p_expected then
    raise exception 'Shop draft changed. Refresh and review the preview before publishing.';
  end if;
  if not exists (select 1 from public.shop_product_drafts where data->>'active' = 'true') then
    raise exception 'Show at least one product in the shop draft before publishing.';
  end if;
  for draft in select * from public.shop_product_drafts order by draft_id loop
    if jsonb_typeof(draft.data->'categories') is distinct from 'array'
      or jsonb_typeof(draft.data->'gallery') is distinct from 'array' then
      raise exception 'A draft product has invalid categories or pictures.';
    end if;
    select array_agg(value order by ordinality) into names
      from jsonb_array_elements_text(draft.data->'categories') with ordinality;
    if coalesce(cardinality(names), 0) not between 1 and 8
      or jsonb_array_length(draft.data->'gallery') not between 1 and 8 then
      raise exception 'A draft product needs categories and pictures.';
    end if;
    insert into public.products as live(product_id, slug, name, category, categories,
      short_description, full_description, price, discount_price, stock_quantity,
      packed_weight_grams, processing_time_days, is_available, details, display_colors, revision)
    values(draft.draft_id, draft.slug, draft.data->>'name', names[1], names,
      draft.data->>'note', draft.data->>'description', (draft.data->>'price')::numeric,
      nullif(draft.data->>'discountPrice', '')::numeric, null,
      (draft.data->>'packedWeightGrams')::integer, 7,
      (draft.data->>'active')::boolean, draft.data->'details', draft.data->'colors', 1)
    on conflict (product_id) do update set
      name = excluded.name, category = excluded.category, categories = excluded.categories,
      short_description = excluded.short_description, full_description = excluded.full_description,
      price = excluded.price, discount_price = excluded.discount_price, stock_quantity = null,
      packed_weight_grams = excluded.packed_weight_grams,
      is_available = excluded.is_available, details = excluded.details,
      display_colors = excluded.display_colors,
      revision = live.revision + 1, updated_at = now();
    delete from public.product_images where product_id = draft.draft_id;
    insert into public.product_images(product_id, image_url, display_order)
      select draft.draft_id, value, (ordinality - 1)::integer
      from jsonb_array_elements_text(draft.data->'gallery') with ordinality;
  end loop;
  select data into content from public.shop_content_drafts where key = 'settings';
  if content is null then raise exception 'Shop content draft is missing.'; end if;
  insert into public.site_content as live(key, data, revision)
    values('settings', content, 1)
    on conflict (key) do update set data = excluded.data,
      revision = live.revision + 1, updated_at = now();
  for draft in select * from public.shop_journey_drafts order by slug loop
    insert into public.journey as live(slug, data, published, revision)
      values(draft.slug, draft.data, draft.published, 1)
      on conflict (slug) do update set data = excluded.data,
        published = excluded.published, revision = live.revision + 1,
        updated_at = now();
  end loop;
  update public.shop_draft_state set dirty = false, last_published_at = now(), updated_at = now()
    where id = true;
  update public.site_runtime set mode = 'shop', updated_at = now() where id = true;
end $$;
revoke execute on function public.shop_publish_and_open(integer) from public, anon, authenticated;
grant execute on function public.shop_publish_and_open(integer) to service_role;

-- Recover email jobs after a function crash and retry provider failures.
create or replace function public.shop_claim_order_emails(p_limit integer default 10)
returns setof public.notification_jobs language sql security definer set search_path = '' as $$
  update public.notification_jobs set status = 'sending', claimed_at = now(), attempts = attempts + 1
  where id in (
    select id from public.notification_jobs
    where kind in ('order_confirmation', 'order_completion') and attempts < 8
      and ((status in ('pending', 'failed') and next_attempt_at <= now())
        or (status = 'sending' and claimed_at < now() - interval '10 minutes'))
    order by created_at for update skip locked limit least(greatest(p_limit, 1), 20)
  ) returning *;
$$;
revoke execute on function public.shop_claim_order_emails(integer) from public, anon, authenticated;
grant execute on function public.shop_claim_order_emails(integer) to service_role;

-- Extend existing status checks with the new stage without removing any
-- previously permitted values. Apply to item/event tables only if needed.
do $$
declare target record; rule record;
begin
  for target in select * from (values
    ('public.orders', 'order_status'),
    ('public.order_items', 'item_status'),
    ('public.order_events', 'status')
  ) as t(table_name, column_name) loop
    for rule in select conname, pg_get_expr(conbin, conrelid) as expression from pg_constraint
      where conrelid = target.table_name::regclass and contype = 'c'
        and pg_get_constraintdef(oid) like '%' || target.column_name || ' = ANY%'
        and pg_get_constraintdef(oid) not like '%dispatched%'
    loop
      execute format('alter table %s drop constraint %I', target.table_name, rule.conname);
      execute format('alter table %s add constraint %I check ((%s) or %I = ''dispatched'') not valid',
        target.table_name, rule.conname, rule.expression, target.column_name);
    end loop;
  end loop;
end $$;

create or replace function public.shop_repair_order_emails()
returns integer language plpgsql security definer set search_path = '' as $$
declare o record; repaired integer := 0;
begin
  for o in select order_id, customer_snapshot, order_status from public.orders
    where checkout_fingerprint is not null and payment_status = 'captured'
      and (not exists (select 1 from public.notification_jobs j
        where j.event_key = 'order_confirmation/' || orders.order_id)
        or (order_status in ('completed', 'dispatched', 'collected') and not exists
          (select 1 from public.notification_jobs j
           where j.event_key = 'order_completion/' || orders.order_id)))
  loop
    begin
      insert into public.notification_jobs(event_key, kind, recipient, payload)
        values('order_confirmation/' || o.order_id, 'order_confirmation',
          o.customer_snapshot->>'email', public.shop_order_email_payload(o.order_id))
        on conflict do nothing;
      if found then repaired := repaired + 1; end if;
      if o.order_status in ('completed', 'dispatched', 'collected') then
        insert into public.notification_jobs(event_key, kind, recipient, payload)
          values('order_completion/' || o.order_id, 'order_completion',
            o.customer_snapshot->>'email', public.shop_order_email_payload(o.order_id))
          on conflict do nothing;
        if found then repaired := repaired + 1; end if;
      end if;
      update public.orders set email_queue_error = null
        where order_id = o.order_id and email_queue_error is not null;
    exception when others then
      update public.orders set email_queue_error = left(sqlerrm, 500) where order_id = o.order_id;
    end;
  end loop;
  return repaired;
end $$;
revoke execute on function public.shop_repair_order_emails() from public, anon, authenticated;
grant execute on function public.shop_repair_order_emails() to service_role;
