-- Apply once in Supabase SQL Editor. Existing orders and products are preserved.
begin;
create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(user_id),
  name text not null, email text not null, item_name text not null, description text,
  occasion text, colors text, budget numeric check (budget >= 0), reference_image text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','counter_offered','student_accepted','paid','in_production','ready','completed')),
  admin_price numeric check (admin_price > 0), admin_notes text, student_response text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 0
);
alter table public.orders add column if not exists customer_snapshot jsonb not null default '{}';
alter table public.orders add column if not exists pickup_location text;
alter table public.orders add column if not exists pickup_instructions text;
alter table public.orders add column if not exists tracking_note text;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists version integer not null default 0;
alter table public.orders add column if not exists checkout_key uuid;
alter table public.orders add column if not exists custom_request_id uuid references public.custom_requests(id);
alter table public.orders add column if not exists stock_reserved boolean not null default false;
alter table public.orders add column if not exists gateway_claim uuid;
alter table public.orders add column if not exists gateway_claimed_at timestamptz;
-- Existing text status constraints may differ between projects. Use one canonical set.
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.orders'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%order_status%' loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.orders add constraint cc_order_status_check check (order_status in ('pending','payment_received','yarn_selected','crocheting','quality_check','ready','completed','collected','cancelled')) not valid;
create unique index if not exists cc_checkout_key on public.orders(user_id, checkout_key) where checkout_key is not null;
create unique index if not exists cc_custom_order on public.orders(custom_request_id) where custom_request_id is not null;
create unique index if not exists cc_gateway_order on public.orders(razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists cc_gateway_payment on public.orders(razorpay_payment_id) where razorpay_payment_id is not null;
create index if not exists cc_user_orders on public.orders(user_id, ordered_at desc);
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(order_id) on delete cascade,
  status text not null, note text, actor_id uuid, created_at timestamptz not null default now()
);
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.users(user_id), name text not null,
  email text not null, subject text not null, message text not null, created_at timestamptz not null default now()
);
create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(), event_key text not null unique, kind text not null,
  recipient text not null, reply_to text, payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0, next_attempt_at timestamptz not null default now(), claimed_at timestamptz,
  sent_at timestamptz, provider_id text, last_error text, created_at timestamptz not null default now()
);
create table if not exists public.creations (
  id uuid primary key default gen_random_uuid(), order_item_id uuid not null unique references public.order_items(order_item_id),
  image_url text, caption text, is_public boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.carts (
  user_id uuid primary key references public.users(user_id), items jsonb not null default '[]',
  version integer not null default 0, updated_at timestamptz not null default now()
);
alter table public.custom_requests add column if not exists submission_key uuid;
alter table public.support_tickets add column if not exists submission_key uuid;
create unique index if not exists cc_request_submission on public.custom_requests(user_id,submission_key);
create unique index if not exists cc_support_submission on public.support_tickets(user_id,submission_key);
create table if not exists public.request_limits (key text primary key, attempts integer not null default 1, reset_at timestamptz not null);
-- All application writes run through authenticated, authorized server routes.
-- Remove permissive legacy policies for commerce tables, then grant own-record reads only.
do $$ declare t text; c record; begin
  foreach t in array array['users','products','product_images','product_colors','orders','order_items','custom_requests','order_events','support_tickets','notification_jobs','creations','carts','request_limits'] loop
    execute format('alter table public.%I enable row level security', t);
    for c in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',c.policyname,t);
    end loop;
    execute format('revoke insert, update, delete on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
create policy cc_products_read on public.products for select to anon, authenticated using (is_available = true);
create policy cc_images_read on public.product_images for select to anon, authenticated using (exists(select 1 from public.products p where p.product_id=product_images.product_id and p.is_available));
create policy cc_colors_read on public.product_colors for select to anon, authenticated using (exists(select 1 from public.products p where p.product_id=product_colors.product_id and p.is_available));
create policy cc_orders_read on public.orders for select to authenticated using (user_id=auth.uid());
create policy cc_items_read on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.order_id=order_items.order_id and o.user_id=auth.uid()));
create policy cc_requests_read on public.custom_requests for select to authenticated using (user_id=auth.uid());
create policy cc_events_read on public.order_events for select to authenticated using (exists(select 1 from public.orders o where o.order_id=order_events.order_id and o.user_id=auth.uid()));
create policy cc_profile_read on public.users for select to authenticated using (user_id=auth.uid());
create policy cc_cart_read on public.carts for select to authenticated using (user_id=auth.uid());
grant select on public.products, public.product_images, public.product_colors to anon, authenticated;
grant select on public.users, public.orders, public.order_items, public.order_events, public.custom_requests, public.carts to authenticated;

create or replace function public.cc_cancel_expired() returns void language plpgsql security definer set search_path=public as $$
declare o record; i record; begin
  -- Attached gateway orders remain payable. Never release their stock on a timer.
  for o in select * from orders where payment_status='pending' and order_status='pending' and stock_reserved and checkout_key is not null and razorpay_order_id is null and (gateway_claimed_at is null or gateway_claimed_at<now()-interval '2 minutes') and ordered_at < now()-interval '30 minutes' for update skip locked loop
    if o.stock_reserved then
      for i in select product_id,sum(quantity) qty from order_items where order_id=o.order_id group by product_id loop
        update products set stock_quantity=stock_quantity+i.qty where product_id=i.product_id and stock_quantity is not null;
      end loop;
    end if;
    update orders set payment_status='failed',order_status='cancelled',stock_reserved=false,version=version+1,updated_at=now() where order_id=o.order_id;
    insert into order_events(order_id,status,note) values(o.order_id,'cancelled','The unpaid checkout expired.');
  end loop;
end $$;

create or replace function public.cc_create_order(p_user uuid,p_items jsonb,p_key uuid,p_customer jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare oid uuid; i record; p record; total numeric:=0; begin
  perform cc_cancel_expired();
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_key::text,0));
  select order_id into oid from orders where user_id=p_user and checkout_key=p_key;
  if oid is not null then return oid; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>50 then raise exception 'Invalid cart'; end if;
  -- Lock products in a stable order and aggregate quantities across colours/duplicate lines.
  for i in select (x->>'productId')::uuid pid,sum((x->>'quantity')::numeric) qty from jsonb_array_elements(p_items) x group by 1 order by 1 loop
    select * into p from products where product_id=i.pid for update;
    if not found or p.is_available is not true then raise exception 'An item is unavailable'; end if;
    if i.qty<1 or i.qty>20 or trunc(i.qty)<>i.qty then raise exception 'Quantity must be an integer between 1 and 20'; end if;
    if p.stock_quantity is not null and p.stock_quantity<i.qty then raise exception 'Insufficient stock for %',p.name; end if;
    total:=total+p.price*i.qty;
  end loop;
  insert into orders(user_id,total_price,payment_status,order_status,checkout_key,customer_snapshot,stock_reserved)
    values(p_user,total,'pending','pending',p_key,p_customer,true) returning order_id into oid;
  for i in select x from jsonb_array_elements(p_items) x loop
    select * into p from products where product_id=(i.x->>'productId')::uuid;
    if (i.x->>'quantity')::numeric<1 or trunc((i.x->>'quantity')::numeric)<>(i.x->>'quantity')::numeric then raise exception 'Invalid quantity'; end if;
    if exists(select 1 from product_colors where product_id=p.product_id) and not exists(select 1 from product_colors where product_id=p.product_id and color_name=i.x->>'color') then raise exception 'Select an available colour'; end if;
    insert into order_items(order_id,product_id,selected_color,quantity,price_at_purchase,processing_time_days,item_status)
      values(oid,p.product_id,coalesce(nullif(i.x->>'color',''),'Default'),(i.x->>'quantity')::integer,p.price,p.processing_time_days,'pending');
    update products set stock_quantity=stock_quantity-(i.x->>'quantity')::integer where product_id=p.product_id and stock_quantity is not null;
  end loop;
  insert into order_events(order_id,status,note) values(oid,'pending','Order placed. Awaiting payment.');
  return oid;
end $$;

create or replace function public.cc_update_order(p_id uuid,p_version integer,p_status text,p_note text,p_location text,p_instructions text,p_actor uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders%rowtype; i record; allowed text[]:=array['pending','payment_received','yarn_selected','crocheting','quality_check','ready','completed','collected']; begin
  select * into o from orders where order_id=p_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.version<>p_version then raise exception 'CONFLICT: This order changed. Refresh before saving.'; end if;
  if not(p_status=any(allowed)) and p_status<>'cancelled' then raise exception 'Invalid status'; end if;
  if o.order_status in ('cancelled','collected') and p_status<>o.order_status then raise exception 'This order is closed'; end if;
  if p_status<> 'cancelled' and array_position(allowed,p_status)<array_position(allowed,o.order_status) then raise exception 'Tracking cannot move backwards'; end if;
  if p_status not in ('pending','cancelled') and o.payment_status<>'captured' then raise exception 'Payment must be captured before production starts'; end if;
  if p_status in ('ready','completed','collected') and coalesce(trim(p_location),'')='' then raise exception 'Enter a pickup location'; end if;
  if p_status='cancelled' and o.payment_status='captured' then raise exception 'Refund this paid order through the payment provider before cancellation'; end if;
  if p_status='cancelled' and o.stock_reserved then
    for i in select product_id,sum(quantity) qty from order_items where order_id=p_id group by product_id loop
      update products set stock_quantity=stock_quantity+i.qty where product_id=i.product_id and stock_quantity is not null;
    end loop;
  end if;
  update orders set order_status=p_status,tracking_note=p_note,pickup_location=p_location,pickup_instructions=p_instructions,
    stock_reserved=case when p_status='cancelled' then false else stock_reserved end,
    completed_at=case when p_status in ('completed','collected') then coalesce(completed_at,now()) else completed_at end,
    version=version+1,updated_at=now() where order_id=p_id returning * into o;
  update order_items set item_status=p_status where order_id=p_id;
  insert into order_events(order_id,status,note,actor_id) values(p_id,p_status,p_note,p_actor);
  if o.custom_request_id is not null and p_status in ('crocheting','ready','completed','collected') then
    update custom_requests set status=case when p_status='crocheting' then 'in_production' when p_status='ready' then 'ready' else 'completed' end,version=version+1,updated_at=now() where id=o.custom_request_id;
  end if;
  if p_status in ('ready','completed') then
    insert into notification_jobs(event_key,kind,recipient,payload)
      values('pickup/'||p_id,'pickup',coalesce(nullif(o.customer_snapshot->>'email',''),(select email from users where user_id=o.user_id)),jsonb_build_object('order_id',p_id,'name',o.customer_snapshot->>'name','location',p_location,'instructions',p_instructions))
      on conflict(event_key) do nothing;
  end if;
  return to_jsonb(o);
end $$;

create or replace function public.cc_custom_order(p_id uuid,p_user uuid,p_customer jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare cr custom_requests%rowtype; oid uuid; pid uuid; begin
  select * into cr from custom_requests where id=p_id and user_id=p_user for update;
  if not found then raise exception 'Request not found'; end if;
  select order_id into oid from orders where custom_request_id=p_id;
  if oid is not null then return oid; end if;
  if cr.status<>'student_accepted' or cr.admin_price is null then raise exception 'Accept the quote before payment'; end if;
  insert into products(name,price,category,full_description,is_available) values('Custom: '||cr.item_name,cr.admin_price,'Custom',cr.description,false) returning product_id into pid;
  insert into orders(user_id,total_price,payment_status,order_status,custom_request_id,customer_snapshot)
    values(p_user,cr.admin_price,'pending','pending',p_id,p_customer) returning order_id into oid;
  insert into order_items(order_id,product_id,selected_color,quantity,price_at_purchase,item_status) values(oid,pid,coalesce(cr.colors,'Custom'),1,cr.admin_price,'pending');
  insert into order_events(order_id,status,note) values(oid,'pending','Custom quote accepted. Awaiting payment.');
  return oid;
end $$;

create or replace function public.cc_capture_payment(p_gateway text,p_payment text,p_amount bigint,p_currency text)
returns uuid language plpgsql security definer set search_path=public as $$
declare o orders%rowtype; begin
  select * into o from orders where razorpay_order_id=p_gateway for update;
  if not found then raise exception 'Payment is not linked to an order'; end if;
  if p_currency<>'INR' or p_amount<>round(o.total_price*100) then raise exception 'Payment amount does not match'; end if;
  if o.payment_status='captured' then
    if o.razorpay_payment_id<>p_payment then raise exception 'Different payment already recorded'; end if;
    return o.order_id;
  end if;
  if o.order_status='cancelled' then raise exception 'Payment arrived after cancellation. Contact support for reconciliation.'; end if;
  update orders set payment_status='captured',payment_method='razorpay',razorpay_payment_id=p_payment,order_status='payment_received',updated_at=now(),version=version+1 where order_id=o.order_id;
  update order_items set item_status='payment_received' where order_id=o.order_id;
  -- Remove purchased quantities once, even if the browser callback never runs.
  -- A repeated capture returns above, so it cannot clear later cart additions.
  if o.custom_request_id is null then
    update carts c set items=coalesce((
      select jsonb_agg(x||jsonb_build_object('quantity',remaining.qty) order by position)
      from jsonb_array_elements(c.items) with ordinality entries(x,position)
      cross join lateral (select (x->>'quantity')::integer-coalesce((select sum(oi.quantity) from order_items oi where oi.order_id=o.order_id and oi.product_id::text=x->>'productId' and oi.selected_color=x->>'color'),0) qty) remaining
      where remaining.qty>0
    ),'[]'::jsonb),version=version+1,updated_at=now() where c.user_id=o.user_id;
  end if;
  insert into order_events(order_id,status,note) values(o.order_id,'payment_received','Payment captured. Your piece is in the production queue.');
  if o.custom_request_id is not null then update custom_requests set status='paid',updated_at=now(),version=version+1 where id=o.custom_request_id; end if;
  return o.order_id;
end $$;

create or replace function public.cc_claim_notifications(p_limit integer default 10)
returns setof notification_jobs language sql security definer set search_path=public as $$
  update notification_jobs set status='sending',claimed_at=now(),attempts=attempts+1
  where id in (select id from notification_jobs where
    ((status in ('pending','failed') and next_attempt_at<=now()) or (status='sending' and claimed_at<now()-interval '10 minutes')) and attempts<8
    order by created_at for update skip locked limit least(p_limit,20)) returning *;
$$;

create or replace function public.cc_save_cart(p_user uuid,p_version integer,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c carts%rowtype; begin
  insert into carts(user_id) values(p_user) on conflict do nothing;
  select * into c from carts where user_id=p_user for update;
  if c.version<>p_version then raise exception 'CONFLICT: Your cart changed in another tab. Please try again.'; end if;
  update carts set items=p_items,version=version+1,updated_at=now() where user_id=p_user returning * into c;
  return to_jsonb(c);
end $$;

create or replace function public.cc_submit_request(p_user uuid,p_key uuid,p_fields jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare cr custom_requests%rowtype; begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_key::text,0));
  select * into cr from custom_requests where user_id=p_user and submission_key=p_key;
  if found then return to_jsonb(cr); end if;
  if not cc_rate_limit('custom/'||p_user,10,3600) then raise exception 'Too many requests. Try again later.'; end if;
  insert into custom_requests(user_id,submission_key,name,email,item_name,description,occasion,colors,budget,reference_image)
    values(p_user,p_key,p_fields->>'name',p_fields->>'email',p_fields->>'item_name',p_fields->>'description',p_fields->>'occasion',p_fields->>'colors',(p_fields->>'budget')::numeric,p_fields->>'reference_image') returning * into cr;
  insert into notification_jobs(event_key,kind,recipient,reply_to,payload)
    values('custom/'||cr.id,'custom_request','support@campus-crochet.tech',cr.email,p_fields||jsonb_build_object('request_id',cr.id));
  return to_jsonb(cr);
end $$;

create or replace function public.cc_submit_support(p_user uuid,p_key uuid,p_name text,p_email text,p_subject text,p_message text)
returns uuid language plpgsql security definer set search_path=public as $$
declare tid uuid; begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_key::text,0));
  select id into tid from support_tickets where user_id=p_user and submission_key=p_key;
  if found then return tid; end if;
  if not cc_rate_limit('support/'||p_user,10,3600) then raise exception 'Too many requests. Try again later.'; end if;
  insert into support_tickets(user_id,submission_key,name,email,subject,message) values(p_user,p_key,p_name,p_email,p_subject,p_message) returning id into tid;
  insert into notification_jobs(event_key,kind,recipient,reply_to,payload)
    values('support/'||tid,'support','support@campus-crochet.tech',p_email,jsonb_build_object('ticket_id',tid,'name',p_name,'email',p_email,'subject',p_subject,'message',p_message));
  return tid;
end $$;

create or replace function public.cc_rate_limit(p_key text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare n integer; begin
  insert into request_limits(key,attempts,reset_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set attempts=case when request_limits.reset_at<now() then 1 else request_limits.attempts+1 end,
    reset_at=case when request_limits.reset_at<now() then now()+make_interval(secs=>p_seconds) else request_limits.reset_at end returning attempts into n;
  return n<=p_limit;
end $$;

create or replace function public.cc_claim_gateway(p_id uuid,p_claim uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders%rowtype; begin
  perform cc_cancel_expired();
  select * into o from orders where order_id=p_id for update;
  if not found or o.payment_status<>'pending' or o.order_status<>'pending' then raise exception 'This order cannot be paid'; end if;
  if o.razorpay_order_id is not null then return to_jsonb(o); end if;
  if o.gateway_claimed_at>now()-interval '2 minutes' then raise exception 'Payment is being prepared. Try again shortly.'; end if;
  update orders set gateway_claim=p_claim,gateway_claimed_at=now() where order_id=p_id returning * into o;
  return to_jsonb(o);
end $$;

create or replace function public.cc_attach_gateway(p_id uuid,p_claim uuid,p_gateway text)
returns void language plpgsql security definer set search_path=public as $$
begin
  update orders set razorpay_order_id=p_gateway,gateway_claim=null,gateway_claimed_at=null where order_id=p_id and gateway_claim=p_claim and payment_status='pending' and order_status='pending';
  if not found then raise exception 'Payment preparation expired. Contact support.'; end if;
end $$;
create or replace function public.cc_save_product(p_id uuid,p_fields jsonb,p_colors jsonb,p_images jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare pid uuid; begin
  if p_id is null then
    insert into products(name,category,price,stock_quantity,processing_time_days,full_description,is_available)
    values(p_fields->>'name',p_fields->>'category',(p_fields->>'price')::numeric,(p_fields->>'stock_quantity')::bigint,(p_fields->>'processing_time_days')::integer,p_fields->>'full_description',(p_fields->>'is_available')::boolean) returning product_id into pid;
  else
    pid:=p_id;
    update products set name=p_fields->>'name',category=p_fields->>'category',price=(p_fields->>'price')::numeric,stock_quantity=(p_fields->>'stock_quantity')::bigint,processing_time_days=(p_fields->>'processing_time_days')::integer,full_description=p_fields->>'full_description',is_available=(p_fields->>'is_available')::boolean,updated_at=now() where product_id=pid;
    if not found then raise exception 'Product not found'; end if;
  end if;
  delete from product_colors where product_id=pid;
  insert into product_colors(product_id,color_name) select pid,value from jsonb_array_elements_text(p_colors);
  delete from product_images where product_id=pid;
  insert into product_images(product_id,image_url,display_order) select pid,value,(ordinality-1)::integer from jsonb_array_elements_text(p_images) with ordinality;
  return pid;
end $$;
-- Secure definer RPCs are never callable directly by customers.
do $$ declare r record; begin
  for r in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname like 'cc\_%' escape '\' loop
    execute format('revoke all on function %s from public, anon, authenticated',r.signature);
    execute format('grant execute on function %s to service_role',r.signature);
  end loop;
end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('creation-photos','creation-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
notify pgrst, 'reload schema';
commit;
